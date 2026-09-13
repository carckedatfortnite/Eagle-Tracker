import { useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

const STATUS_ORDER = [
  'draft',
  'scoutmaster_review',
  'committee_review',
  'district_review',
  'beneficiary_signoff',
  'in_progress',
  'writeup',
  'board_review',
  'approved',
];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadProject() {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          setProject(data);
        }
        setLoading(false);
      }
      loadProject();
    }, [id])
  );

  async function handleAdvance() {
    if (!project) return;
    const currentIndex = STATUS_ORDER.indexOf(project.status);
    const nextStatus = STATUS_ORDER[currentIndex + 1];
    if (!nextStatus) return;

    const { error } = await supabase
      .from('projects')
      .update({ status: nextStatus })
      .eq('id', project.id);

    if (error) return;

    if (nextStatus === 'scoutmaster_review') {
      await supabase.from('approvals').insert({
        project_id: project.id,
        role_required: 'scoutmaster',
        status: 'pending',
      });
    }

    setProject({ ...project, status: nextStatus });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text>Project not found.</Text>
      </View>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(project.status);
  const isFinal = currentIndex === STATUS_ORDER.length - 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{project.title}</Text>
      <Text style={styles.description}>{project.description}</Text>
      <Text style={styles.label}>Beneficiary: {project.beneficiary_name}</Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Current status</Text>
        <Text style={styles.statusValue}>{project.status}</Text>
      </View>

      <Button
        title={isFinal ? 'Project complete' : 'Advance to next status'}
        onPress={handleAdvance}
        disabled={isFinal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  description: { fontSize: 14, color: '#555' },
  label: { fontSize: 14, color: '#333' },
  statusBox: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 12, marginVertical: 12 },
  statusLabel: { fontSize: 12, color: '#777' },
  statusValue: { fontSize: 18, fontWeight: '600', textTransform: 'uppercase', color: '#333' },
});