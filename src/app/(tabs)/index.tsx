import * as Device from 'expo-device';
import { Platform, StyleSheet, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Link } from 'expo-router';
import { useState, useCallback } from 'react';
import { FlatList } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from 'expo-router';
function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
const [projects, setProjects] = useState<any[]>([]);
const router = useRouter();

useFocusEffect(
  useCallback(() => {
    async function loadProjects() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('scout_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
    }
    loadProjects();
  }, [])
);
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            Welcome to&nbsp;Expo
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          get started
        </ThemedText>

                <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <HintRow
            title="Try editing"
            hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
          />
          <HintRow title="Dev tools" hint={getDevMenuHint()} />
          <HintRow
            title="Fresh start"
            hint={<ThemedText type="code">npm run reset-project</ThemedText>}
          />
        </ThemedView>

        <Link href="/signup" style={{ fontSize: 20, color: 'blue', padding: 20, backgroundColor: 'yellow' }}>
  SIGN UP HERE
        </Link>
        <Link href="/login" style={{ fontSize: 20, color: 'blue', padding: 20, backgroundColor: 'lightgreen' }}>
  LOG IN HERE
        </Link>
        <Link href="/new-project" style={{ fontSize: 18, color: 'blue', padding: 16, backgroundColor: 'lightblue' }}>
  + New Project
        </Link>

        <View style={{ width: '100%', padding: 16 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#333' }}>My Projects</Text>
          {projects.length === 0 ? (
            <Text style={{ color: '#333' }}>No projects yet.</Text>
          ) : (
            projects.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push('/project/' + p.id)}
                style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee', width: '100%' }}>
                <Text style={{ fontWeight: '600' }}>{p.title}</Text>
                <Text>{p.status}</Text>
              </Pressable>
            ))
          )}
        </View>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
