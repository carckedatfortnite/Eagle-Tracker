import { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function NewProjectScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  async function handleCreate() {
    setErrorMsg('');

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setErrorMsg('You must be logged in to create a project.');
      return;
    }

    const { error } = await supabase.from('projects').insert({
      scout_id: userData.user.id,
      title,
      description,
      beneficiary_name: beneficiaryName,
      status: 'draft',
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Eagle Project</Text>
      <TextInput
        style={styles.input}
        placeholder="Project Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Beneficiary (e.g. church, school, park)"
        value={beneficiaryName}
        onChangeText={setBeneficiaryName}
      />
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      <Button title="Create Project" onPress={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  multiline: { height: 100, textAlignVertical: 'top' },
  error: { color: 'red' },
});