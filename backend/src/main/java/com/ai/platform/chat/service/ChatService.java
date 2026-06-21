package com.ai.platform.chat.service;

import com.ai.platform.ai.AiErrorMapper;
import com.ai.platform.ai.AiModel;
import com.ai.platform.ai.ModelRouterService;
import com.ai.platform.chat.dto.*;
import com.ai.platform.chat.entity.Conversation;
import com.ai.platform.chat.entity.Message;
import com.ai.platform.chat.repository.ConversationRepository;
import com.ai.platform.chat.repository.MessageRepository;
import com.ai.platform.common.exception.ApiException;
import com.ai.platform.document.entity.Document;
import com.ai.platform.document.repository.DocumentRepository;
import com.ai.platform.usage.service.UsageTrackingService;
import com.ai.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Flux;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ModelRouterService modelRouterService;
    private final DocumentRepository documentRepository;
    private final TransactionTemplate transactionTemplate;
    private final UsageTrackingService usageTrackingService;

    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(User user) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::toConversationDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConversationDto createConversation(User user, CreateConversationRequest request) {
        Conversation conversation = Conversation.builder()
                .user(user)
                .title(request.getTitle() != null ? request.getTitle() : "New Chat")
                .model(request.getModel() != null ? request.getModel() : AiModel.GROQ_LLAMA_70B)
                .build();
        return toConversationDto(conversationRepository.save(conversation));
    }

    @Transactional(readOnly = true)
    public List<MessageDto> getMessages(User user, Long conversationId) {
        Conversation conversation = getConversationForUser(user, conversationId);
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        List<Document> documents = conversation.getDocuments().stream()
                .sorted(Comparator.comparing(Document::getCreatedAt))
                .collect(Collectors.toList());

        return messages.stream()
                .map(message -> toMessageDto(message, documents, conversation.getId(), user.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageDto chat(User user, ChatRequest request) {
        Conversation conversation = resolveConversation(user, request);
        saveUserMessage(conversation, resolveUserMessageContent(request), request, user);

        String response = callLlm(conversation, request.getContent());
        Message assistantMessage = saveAssistantMessage(conversation, response);
        updateConversationTitle(conversation, request.getContent());
        usageTrackingService.recordUsage(user, conversation, request.getModel() != null ? request.getModel() : conversation.getModel(),
                request.getContent(), response);

        return toMessageDto(assistantMessage);
    }

    public Flux<String> chatStream(User user, ChatRequest request) {
        Conversation conversation = transactionTemplate.execute(status -> {
            Conversation c = resolveConversation(user, request);
            saveUserMessage(c, resolveUserMessageContent(request), request, user);
            updateConversationTitle(c, request.getContent());
            return c;
        });

        final Long conversationId = conversation.getId();
        Conversation conversationWithDocs = conversationRepository
                .findByIdAndUserIdWithDocuments(conversationId, user.getId())
                .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));

        Prompt prompt = buildPrompt(conversationWithDocs, request.getContent());
        final AiModel model = request.getModel() != null ? request.getModel() : conversationWithDocs.getModel();
        final String promptContent = request.getContent();

        StringBuilder fullResponse = new StringBuilder();
        return modelRouterService.streamContent(model, prompt)
                .doOnNext(fullResponse::append)
                .doOnComplete(() -> {
                    if (!fullResponse.isEmpty()) {
                        transactionTemplate.executeWithoutResult(status -> {
                            Conversation c = conversationRepository.findById(conversationId)
                                    .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
                            saveAssistantMessage(c, fullResponse.toString());
                            usageTrackingService.recordUsage(user, c, model, promptContent, fullResponse.toString());
                        });
                    }
                })
                .onErrorResume(e -> {
                    String errorMsg = AiErrorMapper.toUserMessage(e);
                    transactionTemplate.executeWithoutResult(status -> {
                        Conversation c = conversationRepository.findById(conversationId)
                                .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
                        saveAssistantMessage(c, errorMsg);
                    });
                    return Flux.just(errorMsg);
                });
    }

    private Conversation resolveConversation(User user, ChatRequest request) {
        if (request.getConversationId() != null) {
            Conversation conversation = getConversationForUser(user, request.getConversationId());
            if (request.getModel() != null) {
                conversation.setModel(request.getModel());
                conversationRepository.save(conversation);
            }
            return conversation;
        }
        Conversation conversation = Conversation.builder()
                .user(user)
                .title(truncate(request.getContent(), 50))
                .model(request.getModel() != null ? request.getModel() : AiModel.GROQ_LLAMA_70B)
                .build();
        return conversationRepository.save(conversation);
    }

    private String callLlm(Conversation conversation, String userContent) {
        Exception lastError = null;
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                return modelRouterService.callContent(
                        conversation.getModel(),
                        buildPrompt(conversation, userContent)
                );
            } catch (Exception e) {
                lastError = e;
                if (!AiErrorMapper.isRetryable(e) || attempt == 1) {
                    break;
                }
                try {
                    Thread.sleep((long) Math.pow(2, attempt) * 1000L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        throw new ApiException(
                AiErrorMapper.toUserMessage(lastError),
                AiErrorMapper.toHttpStatus(lastError)
        );
    }

    private Prompt buildPrompt(Conversation conversation, String userContent) {
        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();

        String systemContext = buildSystemContext(conversation);
        if (!systemContext.isBlank()) {
            messages.add(new SystemMessage(systemContext));
        }

        messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .forEach(msg -> {
                    if ("user".equalsIgnoreCase(msg.getRole())) {
                        messages.add(new UserMessage(msg.getContent()));
                    } else if ("assistant".equalsIgnoreCase(msg.getRole())) {
                        messages.add(new AssistantMessage(msg.getContent()));
                    }
                });

        if (messages.isEmpty() || !(messages.get(messages.size() - 1) instanceof UserMessage um && um.getText().equals(userContent))) {
            messages.add(new UserMessage(userContent));
        }

        return new Prompt(messages);
    }

    private String buildSystemContext(Conversation conversation) {
        StringBuilder sb = new StringBuilder("Bạn là trợ lý AI thông minh, hữu ích và thân thiện. Trả lời bằng tiếng Việt trừ khi người dùng yêu cầu ngôn ngữ khác.");

        if (!conversation.getDocuments().isEmpty()) {
            sb.append("\n\nDưới đây là nội dung tài liệu người dùng đính kèm:\n---\n");
            for (Document doc : conversation.getDocuments()) {
                if (doc.getExtractedText() != null && !doc.getExtractedText().isBlank()) {
                    sb.append("File: ").append(doc.getFilename()).append("\n");
                    sb.append(truncate(doc.getExtractedText(), 15000)).append("\n---\n");
                }
            }
            sb.append("Hãy trả lời dựa trên tài liệu trên khi liên quan.");
        }

        return sb.toString();
    }

    private String resolveUserMessageContent(ChatRequest request) {
        if (request.getDisplayContent() != null && !request.getDisplayContent().isBlank()) {
            return request.getDisplayContent();
        }
        return request.getContent();
    }

    private void saveUserMessage(Conversation conversation, String content, ChatRequest request, User user) {
        Message.MessageBuilder builder = Message.builder()
                .conversation(conversation)
                .role("user")
                .content(content);

        if (request != null) {
            if (request.getAttachmentDocumentId() != null) {
                builder.attachmentDocumentId(request.getAttachmentDocumentId());
            }
            if (request.getAttachmentFilename() != null && !request.getAttachmentFilename().isBlank()) {
                builder.attachmentFilename(request.getAttachmentFilename());
            }
            if (request.getAttachmentMimeType() != null && !request.getAttachmentMimeType().isBlank()) {
                builder.attachmentMimeType(request.getAttachmentMimeType());
            }
            if (request.getAttachmentDocumentId() != null
                    && (request.getAttachmentFilename() == null || request.getAttachmentFilename().isBlank())) {
                documentRepository.findByIdAndUserId(request.getAttachmentDocumentId(), user.getId())
                        .ifPresent(doc -> applyAttachment(builder, doc));
            }
        }

        Message message = builder.build();
        if (message.getAttachmentFilename() == null) {
            resolveConversationDocument(conversation.getId(), user.getId(), message.getCreatedAt())
                    .ifPresent(doc -> applyAttachment(message, doc));
        }

        messageRepository.save(message);
    }

    private java.util.Optional<Document> resolveConversationDocument(Long conversationId, Long userId, LocalDateTime messageTime) {
        return conversationRepository.findByIdAndUserIdWithDocuments(conversationId, userId)
                .flatMap(conversation -> {
                    if (conversation.getDocuments().isEmpty()) {
                        return java.util.Optional.empty();
                    }
                    List<Document> sorted = conversation.getDocuments().stream()
                            .sorted(Comparator.comparing(Document::getCreatedAt))
                            .collect(Collectors.toList());

                    Document best = null;
                    LocalDateTime compareTime = messageTime != null ? messageTime : LocalDateTime.now();
                    for (Document doc : sorted) {
                        if (!doc.getCreatedAt().isAfter(compareTime)) {
                            best = doc;
                        }
                    }
                    return java.util.Optional.ofNullable(best != null ? best : sorted.get(sorted.size() - 1));
                });
    }

    private void applyAttachment(Message.MessageBuilder builder, Document document) {
        builder.attachmentFilename(document.getFilename());
        builder.attachmentMimeType(document.getMimeType());
        builder.attachmentDocumentId(document.getId());
    }

    private void applyAttachment(Message message, Document document) {
        message.setAttachmentFilename(document.getFilename());
        message.setAttachmentMimeType(document.getMimeType());
        message.setAttachmentDocumentId(document.getId());
    }

    private Message saveAssistantMessage(Conversation conversation, String content) {
        Message message = Message.builder()
                .conversation(conversation)
                .role("assistant")
                .content(content)
                .build();
        return messageRepository.save(message);
    }

    private void updateConversationTitle(Conversation conversation, String content) {
        if ("New Chat".equals(conversation.getTitle()) && content != null && !content.isBlank()) {
            conversation.setTitle(truncate(content, 50));
            conversationRepository.save(conversation);
        }
    }

    @Transactional
    public void deleteConversation(User user, Long conversationId) {
        Conversation conversation = getConversationForUser(user, conversationId);
        conversationRepository.delete(conversation);
    }

    private Conversation getConversationForUser(User user, Long conversationId) {
        return conversationRepository.findByIdAndUserIdWithDocuments(conversationId, user.getId())
                .orElseThrow(() -> new ApiException("Conversation not found", HttpStatus.NOT_FOUND));
    }

    private ConversationDto toConversationDto(Conversation c) {
        return ConversationDto.builder()
                .id(c.getId())
                .title(c.getTitle())
                .model(c.getModel())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private MessageDto toMessageDto(Message m) {
        return MessageDto.builder()
                .id(m.getId())
                .role(m.getRole())
                .content(m.getContent())
                .attachmentFilename(m.getAttachmentFilename())
                .attachmentMimeType(m.getAttachmentMimeType())
                .attachmentDocumentId(m.getAttachmentDocumentId())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private MessageDto toMessageDto(Message m, List<Document> conversationDocuments, Long conversationId, Long userId) {
        Document attachmentDocument = null;
        if (m.getAttachmentFilename() == null
                && "user".equalsIgnoreCase(m.getRole())
                && !conversationDocuments.isEmpty()) {
            attachmentDocument = resolveConversationDocument(conversationId, userId, m.getCreatedAt())
                    .or(() -> resolveDocumentForMessage(m, conversationDocuments))
                    .orElse(null);
        }

        return MessageDto.builder()
                .id(m.getId())
                .role(m.getRole())
                .content(m.getContent())
                .attachmentFilename(m.getAttachmentFilename() != null
                        ? m.getAttachmentFilename()
                        : attachmentDocument != null ? attachmentDocument.getFilename() : null)
                .attachmentMimeType(m.getAttachmentMimeType() != null
                        ? m.getAttachmentMimeType()
                        : attachmentDocument != null ? attachmentDocument.getMimeType() : null)
                .attachmentDocumentId(m.getAttachmentDocumentId() != null
                        ? m.getAttachmentDocumentId()
                        : attachmentDocument != null ? attachmentDocument.getId() : null)
                .createdAt(m.getCreatedAt())
                .build();
    }

    private java.util.Optional<Document> resolveDocumentForMessage(Message message, List<Document> documents) {
        LocalDateTime messageTime = message.getCreatedAt();
        Document best = null;
        for (Document doc : documents) {
            if (messageTime == null || !doc.getCreatedAt().isAfter(messageTime)) {
                best = doc;
            }
        }
        return java.util.Optional.ofNullable(best != null ? best : documents.get(documents.size() - 1));
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...";
    }
}
