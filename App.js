import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  Keyboard,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
const { width, height } = Dimensions.get('window');

// Account Dropdown Component
const AccountDropdown = React.memo(({ selectedAccount, onAccountChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const accounts = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => 
      String(i + 1).padStart(4, '0')
    );
  }, []);

  const handleAccountSelect = useCallback((account) => {
    onAccountChange(account);
    setIsOpen(false);
  }, [onAccountChange]);

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownButtonText}>Account: {selectedAccount}</Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="white" 
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>Select Account</Text>
            </View>
            
            <ScrollView 
              style={styles.accountList}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account}
                  style={[
                    styles.accountItem,
                    account === selectedAccount && styles.selectedAccountItem
                  ]}
                  onPress={() => handleAccountSelect(account)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.accountItemText,
                    account === selectedAccount && styles.selectedAccountItemText
                  ]}>
                    Account {account}
                  </Text>
                  {account === selectedAccount && (
                    <Ionicons name="checkmark" size={16} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

// Problem Reporting Modal
const ProblemReportModal = React.memo(({ isOpen, onClose, onSubmit, selectedAccount }) => {
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const problemTypes = useMemo(() => [
    { value: 'internet_down', label: 'Complete Internet Outage', icon: 'wifi-off' },
    { value: 'slow_connection', label: 'Slow Connection Speed', icon: 'wifi' },
    { value: 'intermittent', label: 'Intermittent Connection Issues', icon: 'warning' },
    { value: 'billing_issue', label: 'Billing Problem', icon: 'card' },
    { value: 'equipment_fault', label: 'Equipment Malfunction', icon: 'hardware-chip' },
    { value: 'other', label: 'Other Issue', icon: 'help-circle' }
  ], []);

  const resetForm = useCallback(() => {
    setProblemType('');
    setDescription('');
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (!problemType || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const problemData = {
      type: problemType,
      description: description.trim(),
      account: selectedAccount,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch("http://192.168.18.116:5678/webhook/send averia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(problemData)
      });

      if (!response.ok) {
        throw new Error("Failed to send problem report");
      }

      const result = await response.json();
      console.log("Report submitted successfully:", result);

      onSubmit?.(problemData);
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert(
        'Submission Failed',
        'Unable to submit your problem report. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [problemType, description, selectedAccount, isSubmitting, onSubmit, onClose]);

  const isFormValid = problemType && description.trim();

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Report a Problem</Text>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraHeight={50}
        >
          {/* Problem Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              What type of problem are you experiencing?
            </Text>
            {problemTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setProblemType(type.value)}
                style={[
                  styles.problemTypeButton,
                  problemType === type.value && styles.selectedProblemType
                ]}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <Ionicons 
                  name={type.icon} 
                  size={20} 
                  color={problemType === type.value ? '#3B82F6' : '#6B7280'} 
                />
                <Text style={[
                  styles.problemTypeText,
                  problemType === type.value && styles.selectedProblemTypeText
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Please describe the problem in detail
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={styles.textArea}
              multiline={true}
              numberOfLines={4}
              placeholder="Provide as much detail as possible to help us resolve your issue quickly..."
              textAlignVertical="top"
              maxLength={1000}
              editable={!isSubmitting}
            />
            <Text style={styles.charCounter}>
              {description.length}/1000 characters
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            style={[
              styles.submitButton,
              (!isFormValid || isSubmitting) && styles.disabledButton
            ]}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Problem Report</Text>
            )}
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
});

// Message Component
const MessageBubble = React.memo(({ message }) => {
  const formatTime = useCallback((timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  return (
    <View style={[
      styles.messageContainer,
      message.isUser ? styles.userMessageContainer : styles.botMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userMessage : 
        message.isError ? styles.errorMessage : styles.botMessage
      ]}>
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userMessageText : 
          message.isError ? styles.errorMessageText : styles.botMessageText
        ]}>
          {message.text}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            message.isUser ? styles.userMessageTime : 
            message.isError ? styles.errorMessageTime : styles.botMessageTime
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          
          {message.dataRows > 0 && (
            <View style={styles.dataRowsBadge}>
              <Text style={styles.dataRowsText}>{message.dataRows} rows</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

// Typing Indicator
const TypingIndicator = React.memo(() => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingDots, { opacity }]}>
          <ActivityIndicator size="small" color="#6B7280" />
          <Text style={styles.typingText}>Assistant is typing...</Text>
        </Animated.View>
      </View>
    </View>
  );
});

// Quick Action Button
const QuickActionButton = React.memo(({ title, icon, onPress, disabled }) => (
  <TouchableOpacity 
    style={[styles.quickActionButton, disabled && styles.disabledQuickAction]} 
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
  >
    <View style={styles.quickActionIcon}>
      <Ionicons name={icon} size={24} color={disabled ? "#9CA3AF" : "#3B82F6"} />
    </View>
    <Text style={[styles.quickActionText, disabled && styles.disabledQuickActionText]}>
      {title}
    </Text>
  </TouchableOpacity>
));

// Main App Component
export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('0001');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Account Assistant. I can help you check your balance, disconnection date, internet plan details, and report any problems you're experiencing. What would you like to know?",
      isUser: false,
      timestamp: Date.now(),
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  
  // Configuration
  const WEBHOOK_URL = 'http://192.168.18.116:5678/webhook/ask-question';

  const quickActions = useMemo(() => [
    { title: "Balance Inquiry", icon: "card", query: "What is my current account balance?" },
    { title: "Disconnection Date", icon: "calendar", query: "When is my disconnection date?" },
    { title: "Internet Plan", icon: "globe", query: "What is my current internet plan?" },
    { title: "Account Summary", icon: "stats-chart", query: "Show me my account summary" },
    { title: "Report Internet Problem", icon: "wifi-off", action: 'report_problem' },
    { title: "Report Billing Issue", icon: "warning", action: 'report_billing' },
  ], []);

  // Keyboard event handlers
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleAccountChange = useCallback((newAccount) => {
    setSelectedAccount(newAccount);
    
    const accountChangeMessage = {
      id: Date.now(),
      text: `✅ Switched to Account ${newAccount}. How can I help you with this account?`,
      isUser: false,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, accountChangeMessage]);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const sendMessage = useCallback(async (messageText = inputText.trim()) => {
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
    
    // Dismiss keyboard
    Keyboard.dismiss();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: messageText,
          accountNumber: selectedAccount,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const responseData = Array.isArray(data) ? data[0] : data;

      const botMessage = {
        id: Date.now() + 1,
        text: responseData.answer || 'Sorry, I couldn\'t find an answer to that question.',
        isUser: false,
        timestamp: Date.now(),
        dataRows: responseData.dataRows || 0,
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorText = '❌ Unable to connect to the server. Please check your internet connection and try again.';
      
      if (error.name === 'AbortError') {
        errorText = '⏱️ Request timed out. Please try again.';
      } else if (error.name === 'TypeError') {
        errorText = '🌐 Network connection failed. Please check your internet connection.';
      }

      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        isUser: false,
        timestamp: Date.now(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [inputText, loading, selectedAccount]);

  const handleQuickAction = useCallback((action) => {
    if (loading) return;
    
    if (action.action === 'report_problem' || action.action === 'report_billing') {
      setShowProblemModal(true);
    } else if (action.query) {
      sendMessage(action.query);
    }
  }, [sendMessage, loading]);

  const handleProblemSubmit = useCallback((problemData) => {
    const problemTypeLabels = {
      'internet_down': 'Complete Internet Outage',
      'slow_connection': 'Slow Connection Speed',
      'intermittent': 'Intermittent Connection Issues',
      'billing_issue': 'Billing Problem',
      'equipment_fault': 'Equipment Malfunction',
      'other': 'Other Issue'
    };

    const ticketId = `#${Date.now().toString().slice(-6)}`;
    
    const problemMessage = {
      id: Date.now(),
      text: `🔧 Problem Report Submitted:\n\nType: ${problemTypeLabels[problemData.type] || problemData.type}\nDescription: ${problemData.description}\nAccount: ${problemData.account}\nTicket ID: ${ticketId}\n\nA support ticket has been created and our team will contact you within 24 hours.`,
      isUser: false,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, problemMessage]);
  }, []);

  const clearChat = useCallback(() => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                id: Date.now(),
                text: "🔄 Chat cleared! How can I help you with your account today?",
                isUser: false,
                timestamp: Date.now(),
              }
            ]);
          }
        }
      ]
    );
  }, []);

  const showQuickActions = messages.length <= 2 && !loading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="chatbubbles" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Account Assistant</Text>
              <AccountDropdown 
                selectedAccount={selectedAccount}
                onAccountChange={handleAccountChange}
              />
            </View>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={() => setShowProblemModal(true)}
              style={styles.reportButton}
              activeOpacity={0.7}
            >
              <Ionicons name="warning" size={16} color="white" />
              <Text style={styles.reportButtonText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={clearChat}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Area */}
        <View style={styles.chatContainer}>
          <KeyboardAwareScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraHeight={120}
            extraScrollHeight={120}
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {loading && <TypingIndicator />}
          </KeyboardAwareScrollView>

          {/* Quick Actions */}
          {showQuickActions && (
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action) => (
                  <QuickActionButton
                    key={action.title}
                    title={action.title}
                    icon={action.icon}
                    onPress={() => handleQuickAction(action)}
                    disabled={loading}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about your account or report a problem..."
                style={styles.textInput}
                multiline={true}
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
                blurOnSubmit={false}
              />
              
              <TouchableOpacity 
                onPress={() => sendMessage()}
                disabled={!inputText.trim() || loading}
                style={[
                  styles.sendButton,
                  (!inputText.trim() || loading) && styles.disabledSendButton
                ]}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Problem Reporting Modal */}
      <ProblemReportModal 
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
        onSubmit={handleProblemSubmit}
        selectedAccount={selectedAccount}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  reportButtonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  dropdownButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: width * 0.8,
    maxHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  accountList: {
    maxHeight: 300,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedAccountItem: {
    backgroundColor: '#EBF4FF',
  },
  accountItemText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedAccountItemText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    flexGrow: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#3B82F6',
  },
  botMessage: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorMessage: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
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
  errorMessageText: {
    color: '#DC2626',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  messageTime: {
    fontSize: 10,
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  botMessageTime: {
    color: '#9CA3AF',
  },
  errorMessageTime: {
    color: '#F87171',
  },
  dataRowsBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dataRowsText: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  quickActionsContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledQuickAction: {
    opacity: 0.5,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#374151',
    fontWeight: '500',
  },
  disabledQuickActionText: {
    color: '#9CA3AF',
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
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  disabledSendButton: {
    backgroundColor: '#9CA3AF',
  },
  // Problem Report Modal Styles
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
  closeButton: {
    padding: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 12,
    flex: 1,
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