import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    letterSpacing: 0,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    letterSpacing: 0,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },  body: {
    fontSize: 16,
    color: '#2D3748',
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
  caption: {
    fontSize: 14,
    color: '#000000',
    letterSpacing: 0,
    fontFamily: Platform.select({
      ios: 'Times New Roman',
      android: 'serif'
    }),
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    padding: 24,
    marginLeft: 30,
    marginRight: 22,
    marginTop: 25,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#2D3748',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
  },
  button: {
    backgroundColor: '#4A5568',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 8,
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    width: '85%',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    letterSpacing: 0,
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    letterSpacing: 0,
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
    marginBottom: 8,
  },
  link: {
    color: '#4299E1',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
  },
  stat: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    letterSpacing: 0,
    marginTop: 8,
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
  },
});