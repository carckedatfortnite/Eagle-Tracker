import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const STATUS_INFO: Record<string, { label: string; hint: string; color: string }> = {
  draft: { label: 'Draft', hint: 'Finish your proposal', color: '#9ca3af' },
  scoutmaster_review: { label: 'In Review', hint: 'Waiting on Scoutmaster', color: '#f59e0b' },
  committee_review: { label: 'In Review', hint: 'Waiting on Committee', color: '#f59e0b' },
  district_review: { label: 'In Review', hint: 'Waiting on District Chair', color: '#f59e0b' },
  beneficiary_signoff: { label: 'In Review', hint: 'Waiting on Beneficiary', color: '#f59e0b' },
  in_progress: { label: 'In Progress', hint: 'Project underway', color: '#3b82f6' },
  writeup: { label: 'Write-up', hint: 'Finish your write-up', color: '#3b82f6' },
  board_review: { label: 'In Review', hint: 'Waiting on Board of Review', color: '#f59e0b' },
  approved: { label: 'Approved', hint: 'Complete', color: '#22c55e' },
};

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setCheckingAuth(true);
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData.user ?? null);

        if (userData.user) {
          const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('scout_id', userData.user.id)
            .order('created_at', { ascending: false });
          if (data) setProjects(data);
        }
        setCheckingAuth(false);
      }
      load();
    }, [])
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProjects([]);
  }

  if (checkingAuth) {
    return (
      <ThemedCenter>
        <Text>Loading...</Text>
      </ThemedCenter>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loggedOutContainer}>
          <Text style={styles.appName}>Eagle Tracker</Text>
          <Text style={styles.tagline}>Track your Eagle Scout project from proposal to approval.</Text>
          <Link href="/login" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Log In</Text>
            </Pressable>
          </Link>
          <Link href="/signup" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.appName}>My Projects</Text>
          <Pressable onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>

        <Link href="/approvals" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Pending Approvals</Text>
          </Pressable>
        </Link>

        {projects.length === 0 ? (
          <Text style={styles.emptyText}>No projects yet — create your first one below.</Text>
        ) : (
          projects.map((p) => {
            const info = STATUS_INFO[p.status] ?? { label: p.status, hint: '', color: '#9ca3af' };
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push('/project/' + p.id)}
                style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <View style={[styles.badge, { backgroundColor: info.color }]}>
                    <Text style={styles.badgeText}>{info.label}</Text>
                  </View>
                </View>
                <Text style={styles.cardHint}>{info.hint}</Text>
              </Pressable>
            );
          })
        )}

        <Link href="/new-project" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>+ New Project</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemedCenter({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingTop: 60, gap: 12, maxWidth: 500, width: '100%', alignSelf: 'center' },  loggedOutContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  appName: { fontSize: 22, fontWeight: '700', color: '#111' },
  tagline: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logoutText: { color: '#ef4444', fontSize: 14 },
  primaryButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondaryButton: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#333', fontWeight: '500', fontSize: 14 },
  emptyText: { color: '#666', textAlign: 'center', marginVertical: 20 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardHint: { fontSize: 13, color: '#666' },
});