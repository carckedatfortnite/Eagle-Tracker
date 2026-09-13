import { useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function ApprovalsScreen() {
  const [approvals, setApprovals] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function loadApprovals() {
        const { data, error } = await supabase
          .from('approvals')
          .select('*, projects(title)')
          .eq('status', 'pending');

        console.log('Approvals data:', data);
        console.log('Approvals error:', error);

        if (!error && data) {
          setApprovals(data);
        }
      }
      loadApprovals();
    }, [])
  );

  async function handleDecision(approvalId: string, projectId: string, decision: 'approved' | 'rejected') {
    await supabase
      .from('approvals')
      .update({ status: decision, decided_at: new Date().toISOString() })
      .eq('id', approvalId);

    if (decision === 'approved') {
      await supabase.from('projects').update({ status: 'committee_review' }).eq('id', projectId);
    }

    setApprovals((prev) => prev.filter((a) => a.id !== approvalId));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Approvals</Text>
      {approvals.length === 0 ? (
        <Text style={styles.empty}>Nothing pending.</Text>
      ) : (
        approvals.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.projectTitle}>{a.projects?.title}</Text>
            <Text style={styles.roleLabel}>Needs: {a.role_required}</Text>
            <View style={styles.buttonRow}>
              <Button title="Approve" onPress={() => handleDecision(a.id, a.project_id, 'approved')} />
              <Button title="Reject" color="red" onPress={() => handleDecision(a.id, a.project_id, 'rejected')} />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  empty: { color: '#666' },
  card: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 16, gap: 8 },
  projectTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  roleLabel: { fontSize: 13, color: '#666' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});