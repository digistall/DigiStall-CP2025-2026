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
    marginBottom: 10,
    position: 'relative',
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
  
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 10, 
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    overflow: 'hidden',
  },
  errorModalHeader: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  errorModalIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  errorModalBody: {
    padding: 20,
    paddingTop: 15,
  },
  errorModalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorModalFooter: {
    padding: 15,
    paddingTop: 0,
  },
  errorModalButton: {
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default styles;