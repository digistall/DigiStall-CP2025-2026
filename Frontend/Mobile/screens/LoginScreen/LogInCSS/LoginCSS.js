import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.73)',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  logoContainer: {
    marginBottom: 20,
  },

  logo: {
    width: 120,
    height: 120,
  },

  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000ff',
    textAlign: 'center',
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000ff',
    textAlign: 'center',
    marginBottom: 10,
  },

  poweredBy: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    textAlign: 'center',
  },

  formContainer: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, 
  },

  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
  },

  inputContainer: {
    marginBottom: 15,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputIconWrapper: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },

  inputIcon: {
    marginRight: 5,
  },

  textInputWithIcon: {
    paddingLeft: 45,
  },

  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 13,
    zIndex: 1,
  },

  dropdownContainer: {
    height: 50, 
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },

  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },

  placeholderText: {
    color: '#999',
  },

  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000000ff',
  },

  arrowUp: {
    borderTopWidth: 0,
    borderBottomWidth: 5,
    borderBottomColor: '#000000ff',
  },
  
  textInput: {
    flex: 1,
    height: 50, 
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },

  loginButton: {
    backgroundColor: '#4472C4',
    height: 50, 
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonDisabled: {
    backgroundColor: '#8FA8D3',
    opacity: 0.7,
  },

  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  forgotPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 14,
    textAlign: 'center',
  },

  // ===== PROFESSIONAL LOADING OVERLAY STYLES =====
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },

  loadingLogoContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 100,
  },

  loadingLogo: {
    width: 80,
    height: 80,
  },

  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },

  loadingSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 25,
  },

  loadingDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4472C4',
    marginHorizontal: 5,
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    width: '100%',
  },

  securityNoteText: {
    fontSize: 12,
    color: '#27ae60',
    marginLeft: 5,
    fontWeight: '500',
  },

  // Progress Bar Styles
  progressBarContainer: {
    width: '100%',
    marginBottom: 20,
  },

  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#4472C4',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },

  // Loading Steps Styles
  loadingStepsContainer: {
    width: '100%',
    marginBottom: 20,
  },

  loadingStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  stepCompleted: {
    backgroundColor: '#27ae60',
  },

  stepActive: {
    backgroundColor: '#4472C4',
  },

  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },

  stepLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },

  stepLabelCompleted: {
    color: '#27ae60',
    fontWeight: '600',
  },

  stepLabelActive: {
    color: '#4472C4',
    fontWeight: '700',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  dropdownList: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200, 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, 
  },
  
  dropdownItem: {
    paddingVertical: 12, 
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  errorModalHeader: {
    paddingTop: 30,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  errorModalIconNew: {
    marginBottom: 10,
  },
  errorModalIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  errorModalTitleSection: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 5,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  errorModalBody: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 25,
  },
  errorModalMessage: {
    fontSize: 15,
    color: '#5a6978',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorModalFooter: {
    padding: 20,
    paddingTop: 0,
  },
  errorModalButton: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  errorModalButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Login Mode Toggle Styles
  loginModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f4f8',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#4472C4',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4472C4',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
});

export default styles;