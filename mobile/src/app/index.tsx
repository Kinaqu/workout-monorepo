import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#05070b',
        gap: 8,
      }}
    >
      <Text style={{ color: '#f8fbff', fontSize: 20, fontWeight: '700' }}>Kinova</Text>
      <Text style={{ color: 'rgba(248,251,255,0.52)', fontSize: 14 }}>mobile scaffold ready</Text>
    </View>
  );
}
