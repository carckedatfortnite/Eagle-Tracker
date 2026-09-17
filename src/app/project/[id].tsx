import { useState, useCallback } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ActivityIndicator, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
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

  const [hoursList, setHoursList] = useState<any[]>([]);
  const [volunteerName, setVolunteerName] = useState('');
  const [hoursAmount, setHoursAmount] = useState('');
  const [hoursDescription, setHoursDescription] = useState('');

  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadProject() {
        setLoading(true);
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
        if (!error && data) {
          setProject(data);
        }
        setLoading(false);
      }
      async function loadHours() {
        const { data, error } = await supabase
          .from('hours_log')
          .select('*')
          .eq('project_id', id)
          .order('date', { ascending: false });
        if (!error && data) {
          setHoursList(data);
        }
      }
      async function loadDocuments() {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', id)
          .order('uploaded_at', { ascending: false });
        if (!error && data) {
          setDocuments(data);
        }
      }
      loadProject();
      loadHours();
      loadDocuments();
    }, [id])
  );

  async function handleAdvance() {
    if (!project) return;
    const currentIndex = STATUS_ORDER.indexOf(project.status);
    const nextStatus = STATUS_ORDER[currentIndex + 1];
    if (!nextStatus) return;

    const { error } = await supabase.from('projects').update({ status: nextStatus }).eq('id', project.id);
    if (error) return;

    if (nextStatus === 'scoutmaster_review') {
      await supabase.from('approvals').insert({
        project_id: project.id,
        role_required: 'scoutmaster',
        status: 'pending',
      });
    }

    if (nextStatus === 'district_review') {
      await supabase.from('approvals').insert({
        project_id: project.id,
        role_required: 'district_chair',
        status: 'pending',
      });
    }

    setProject({ ...project, status: nextStatus });
  }

  async function handleAddHours() {
    if (!volunteerName || !hoursAmount) return;

    const { error } = await supabase.from('hours_log').insert({
      project_id: id,
      volunteer_name: volunteerName,
      date: new Date().toISOString().split('T')[0],
      hours: parseFloat(hoursAmount),
      description: hoursDescription,
    });

    if (!error) {
      setVolunteerName('');
      setHoursAmount('');
      setHoursDescription('');

      const { data } = await supabase
        .from('hours_log')
        .select('*')
        .eq('project_id', id)
        .order('date', { ascending: false });
      if (data) setHoursList(data);
    }
  }

  async function handleUploadDocument() {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const file = result.assets[0];
    setUploading(true);

    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const filePath = `${id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, { contentType: file.mimeType || 'application/octet-stream' });

      if (uploadError) {
        console.log('Upload error:', uploadError);
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('documents').insert({
        project_id: id,
        type: 'proposal',
        file_url: publicUrlData.publicUrl,
        version: 1,
      });

      if (insertError) {
        console.log('Insert error:', insertError);
      }

      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', id)
        .order('uploaded_at', { ascending: false });
      if (data) setDocuments(data);
    } catch (e) {
      console.log('Upload exception:', e);
    }

    setUploading(false);
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
  const totalHours = hoursList.reduce((sum, h) => sum + Number(h.hours), 0);

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hours Logged: {totalHours}</Text>

        <TextInput
          style={styles.input}
          placeholder="Volunteer name"
          value={volunteerName}
          onChangeText={setVolunteerName}
        />
        <TextInput
          style={styles.input}
          placeholder="Hours (e.g. 2.5)"
          value={hoursAmount}
          onChangeText={setHoursAmount}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="What did they do?"
          value={hoursDescription}
          onChangeText={setHoursDescription}
        />
        <Button title="Add Hours" onPress={handleAddHours} />

        {hoursList.map((h) => (
          <View key={h.id} style={styles.rowItem}>
            <Text style={styles.rowText}>
              {h.volunteer_name} — {h.hours} hrs ({h.date})
            </Text>
            <Text style={styles.rowDesc}>{h.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents</Text>

        <Button
          title={uploading ? 'Uploading...' : 'Upload Document'}
          onPress={handleUploadDocument}
          disabled={uploading}
        />

        {documents.map((d) => (
          <Pressable key={d.id} onPress={() => Linking.openURL(d.file_url)} style={styles.rowItem}>
            <Text style={styles.rowText}>{d.type} (v{d.version})</Text>
            <Text style={styles.rowLink}>Tap to view</Text>
          </Pressable>
        ))}
      </View>
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
  section: { marginTop: 24, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  rowItem: { borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 8 },
  rowText: { fontSize: 14, fontWeight: '600', color: '#333' },
  rowDesc: { fontSize: 13, color: '#666' },
  rowLink: { fontSize: 13, color: '#2563eb' },
});