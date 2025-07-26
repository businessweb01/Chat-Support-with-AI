import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Problem Reporting Modal
const ProblemReportModal = React.memo(({ isOpen, onClose, onSubmit, selectedAccount }) => {
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const problemTypes = [
    { value: 'internet_down', label: 'Complete Internet Outage' },
    { value: 'slow_connection', label: 'Slow Connection Speed' },
    { value: 'intermittent', label: 'Intermittent Connection Issues' },
    { value: 'billing_issue', label: 'Billing Problem' },
    { value: 'equipment_fault', label: 'Equipment Malfunction' },
    { value: 'other', label: 'Other Issue' }
  ];

  const resetForm = () => {
    setProblemType('');
    setDescription('');
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!problemType || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const problemData = {
      type: problemType,
      description: description.trim(),
      account: selectedAccount,
      timestamp: new Date().toISOString(),
      sessionId: selectedAccount
    };

    try {
    //  http://localhost:5678/webhook-test/send averia
      const response = await fetch("http://192.168.18.116:5678/webhook/send-averia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(problemData)
      });

      if (!response.ok) throw new Error("Failed to send problem report");
      
      const result = await response.json();
      let aiResponse = '';
      if (result && Array.isArray(result) && result.length > 0 && result[0].output) {
        aiResponse = result[0].output;
      }
      
      onSubmit?.(problemData, aiResponse);
      onClose();
      
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert('Submission Failed', 'Unable to submit your problem report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Report a Problem</Text>
          <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What type of problem are you experiencing?</Text>
            {problemTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setProblemType(type.value)}
                style={[styles.problemTypeButton, problemType === type.value && styles.selectedProblemType]}
                disabled={isSubmitting}
              >
                <Text style={[styles.problemTypeText, problemType === type.value && styles.selectedProblemTypeText]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Please describe the problem</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Describe your issue..."
              maxLength={500}
              editable={!isSubmitting}
            />
            <Text style={styles.charCounter}>{description.length}/500 characters</Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!problemType || !description.trim() || isSubmitting}
            style={[styles.submitButton, (!problemType || !description.trim() || isSubmitting) && styles.disabledButton]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
});

// Message Component
const MessageBubble = React.memo(({ message }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.messageContainer, message.isUser ? styles.userMessageContainer : styles.botMessageContainer]}>
      <View style={[styles.messageBubble, message.isUser ? styles.userMessage : styles.botMessage]}>
        <Text style={[styles.messageText, message.isUser ? styles.userMessageText : styles.botMessageText]}>
          {message.text}
        </Text>
        <Text style={[styles.messageTime, message.isUser ? styles.userMessageTime : styles.botMessageTime]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
});

// Main App Component
export default function App() {
  const [inputText, setInputText] = useState('');
  const [accountNumber, setAccountNumber] = useState('0001');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Account Assistant. I can help you check your balance, disconnection date, account summary, and report problems. What would you like to know?",
      isUser: false,
      timestamp: Date.now(),
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  
  const scrollViewRef = useRef(null);
  const WEBHOOK_URL = 'http://192.168.18.116:5678/webhook/ask-question';

  const quickActions = [
    { title: "Balance", query: "What is my current account balance?" },
    { title: "Disconnection Date", query: "When is my disconnection date?" },
    { title: "Account Summary", query: "Show me my account summary" },
    { title: "Report Issue", action: 'report_problem' },
  ];

  const scrollToBottom = () => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (messageText = inputText.trim()) => {
    if (!messageText || loading) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    Keyboard.dismiss();

    try {
      const dateNow = new Date();
      const formattedDate = `${dateNow.getFullYear()}-${String(dateNow.getMonth() + 1).padStart(2, '0')}-${String(dateNow.getDate()).padStart(2, '0')}`;
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: messageText,
          accountNumber: accountNumber,
          sessionId: accountNumber,
          date: formattedDate
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const responseData = Array.isArray(data) ? data[0] : data;

      const botMessage = {
        id: Date.now() + 1,
        text: responseData.answer || 'Sorry, I couldn\'t find an answer to that question.',
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: '❌ Unable to connect to the server. Please check your internet connection and try again.',
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    if (loading) return;
    if (action.action === 'report_problem') {
      setShowProblemModal(true);
    } else if (action.query) {
      sendMessage(action.query);
    }
  };

  const handleProblemSubmit = (problemData, aiResponse = null) => {
    const problemTypeLabels = {
      'internet_down': 'Complete Internet Outage',
      'slow_connection': 'Slow Connection Speed',
      'intermittent': 'Intermittent Connection Issues',
      'billing_issue': 'Billing Problem',
      'equipment_fault': 'Equipment Malfunction',
      'other': 'Other Issue'
    };

    let problemMessage;
    if (aiResponse && aiResponse.trim() !== '') {
      problemMessage = {
        id: Date.now(),
        text: `🚫 Account Status Alert:\n\n${aiResponse}`,
        isUser: false,
        timestamp: Date.now(),
      };
    } else {
      const ticketId = `#${Date.now().toString().slice(-6)}`;
      problemMessage = {
        id: Date.now(),
        text: `🔧 Problem Report Submitted:\n\nType: ${problemTypeLabels[problemData.type]}\nDescription: ${problemData.description}\nAccount: ${problemData.account}\nTicket ID: ${ticketId}\n\nOur team will contact you within 24 hours.`,
        isUser: false,
        timestamp: Date.now(),
      };
    }

    setMessages(prev => [...prev, problemMessage]);
  };

  const clearChat = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear all messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setMessages([{
            id: Date.now(),
            text: "🔄 Chat cleared! How can I help you with your account today?",
            isUser: false,
            timestamp: Date.now(),
          }]);
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles" size={24} color="white" />
          <Text style={styles.headerTitle}>Account Assistant</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TextInput
            value={accountNumber}
            onChangeText={setAccountNumber}
            style={styles.accountInput}
            placeholder="Account"
            placeholderTextColor="rgba(255,255,255,0.7)"
            maxLength={10}
          />
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Ionicons name="trash" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Area */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {loading && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.typingText}>Assistant is typing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      {messages.length <= 2 && !loading && (
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action)}
              >
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your account or report a problem..."
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.disabledSendButton]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowProblemModal(true)}
            style={styles.reportButton}
          >
            <Ionicons name="warning" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Problem Reporting Modal */}
      <ProblemReportModal 
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
        onSubmit={handleProblemSubmit}
        selectedAccount={accountNumber}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'center',
    marginRight: 8,
  },
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    backgroundColor: '#3B82F6',
  },
  botMessage: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#374151',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  botMessageTime: {
    color: '#9CA3AF',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  quickActionsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  quickActionButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    maxHeight: 100,
    minHeight: 20,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 18,
    padding: 8,
    marginLeft: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#9CA3AF',
  },
  reportButton: {
    backgroundColor: '#EF4444',
    borderRadius: 18,
    padding: 8,
    marginLeft: 4,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  problemTypeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  selectedProblemType: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  problemTypeText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedProblemTypeText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#374151',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});