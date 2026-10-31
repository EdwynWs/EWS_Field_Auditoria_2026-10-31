import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, ScrollView, TextInput, TouchableOpacity, Pressable,
  StyleSheet, ActivityIndicator, Alert, RefreshControl, KeyboardAvoidingView,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from './config';
import { session } from './session';
import * as Crypto from 'expo-crypto';

const P = {
  navy: '#0B1830', navy2: '#152846', blue: '#2563EB', blue2: '#1D4ED8',
  pale: '#EAF1FF', bg: '#F4F7FB', white: '#FFFFFF', text: '#17243B',
  muted: '#79879B', line: '#E7ECF4', green: '#12A879', gold: '#F3A536',
  red: '#E85864', teal: '#22B8AE',
};
const STATUS = {
  open: { label: 'Aberta', color: '#B86F15', bg: '#FFF3E2', icon: 'time-outline' },
  assigned: { label: 'Atribuída', color: '#3569D5', bg: '#E9F0FF', icon: 'person-outline' },
  in_progress: { label: 'Em andamento', color: '#128C84', bg: '#E5F8F5', icon: 'sync-outline' },
  completed: { label: 'Concluída', color: '#16885A', bg: '#E6F7ED', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelada', color: '#C24A59', bg: '#FCECF0', icon: 'close-circle-outline' },
};
const TODAY = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date());
const shortDate = (value) => {
  if (!value) return 'Sem agendamento';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'Data não informada' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};
const firstName = (name) => (name || 'Usuário').trim().split(' ')[0];
const initials = (name) => (name || '?').trim().split(' ').slice(0, 2).map(x => x[0]?.toUpperCase()).join('');

function Icon({ name, size = 21, color = P.text }) {
  return <Ionicons name={name} size={size} color={color} />;
}
function TButton({ label, onPress, icon, variant = 'primary', disabled, style, small }) {
  const dark = variant === 'primary';
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled:!!disabled}} activeOpacity={0.82} disabled={disabled} onPress={onPress}
      style={[styles.button, small && styles.buttonSmall,
        variant === 'primary' && { backgroundColor: P.blue },
        variant === 'dark' && { backgroundColor: P.navy },
        variant === 'soft' && { backgroundColor: P.pale },
        variant === 'outline' && { backgroundColor: P.white, borderWidth: 1, borderColor: P.line },
        disabled && { opacity: 0.45 }, style]}>
      {icon && <Icon name={icon} size={small ? 17 : 19} color={dark || variant === 'dark' ? '#FFF' : P.blue} />}
      <Text style={[styles.buttonText, !(dark || variant === 'dark') && { color: P.blue }, small && { fontSize: 12 }]}>{label}</Text>
    </TouchableOpacity>
  );
}
function Field({ label, value, onChangeText, placeholder, icon, secureTextEntry, multiline, keyboardType, autoCapitalize = 'sentences' }) {
  return (
    <View style={{ marginBottom: 15 }}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View style={[styles.inputWrap, multiline && { alignItems: 'flex-start', minHeight: 110 }]}>
        {icon && <View style={{ marginTop: multiline ? 3 : 0 }}><Icon name={icon} color={P.muted} size={19} /></View>}
        <TextInput style={[styles.input, multiline && { height: 95, textAlignVertical: 'top' }]}
          accessibilityLabel={label || placeholder} placeholder={placeholder} placeholderTextColor="#99A5B5" value={value}
          onChangeText={onChangeText} secureTextEntry={secureTextEntry} multiline={multiline}
          keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoCorrect={!secureTextEntry} />
      </View>
    </View>
  );
}
function Card({ children, style }) { return <View style={[styles.card, style]}>{children}</View>; }
function SectionHeader({ title, right, onRight }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{right && <TouchableOpacity onPress={onRight}><Text style={styles.sectionLink}>{right}  ›</Text></TouchableOpacity>}</View>;
}
function StatusPill({ status }) {
  const m = STATUS[status] || STATUS.open;
  return <View style={[styles.pill, { backgroundColor: m.bg }]}><View style={[styles.statusDot, { backgroundColor: m.color }]} /><Text style={[styles.pillText, { color: m.color }]}>{m.label}</Text></View>;
}
function Empty({ icon, title, subtitle, action, onAction }) {
  return <Card style={styles.empty}>
    <View style={styles.emptyIcon}><Icon name={icon} size={29} color={P.blue} /></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySub}>{subtitle}</Text>
    {action && <TButton label={action} onPress={onAction} small style={{ marginTop: 18 }} />}
  </Card>;
}
function OrderCard({ order, onPress }) {
  return <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={styles.orderCard}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
      <StatusPill status={order.status} />
      <Text style={styles.orderDate}>{shortDate(order.scheduled_at || order.created_at)}</Text>
    </View>
    <Text style={styles.orderTitle} numberOfLines={2}>{order.title}</Text>
    <View style={styles.orderInfo}><Icon name="business-outline" size={15} color={P.muted}/><Text style={styles.orderInfoText} numberOfLines={1}>{order.customer_name}</Text></View>
    <View style={styles.orderFooter}><View style={styles.orderInfo}><Icon name="person-outline" size={15} color={P.muted}/><Text style={styles.orderInfoText} numberOfLines={1}>{order.technician_name || 'Aguardando técnico'}</Text></View><Icon name="arrow-forward-circle" size={26} color={P.blue}/></View>
  </TouchableOpacity>;
}
function AppContent() {
  const [token, setToken] = useState('');
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [team, setTeam] = useState([]);
  const [tab, setTab] = useState('home');
  const [managePage, setManagePage] = useState('menu');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [orderTitle, setOrderTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [techId, setTechId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('technician');
  const manager = me?.role === 'manager';
  const sessionEpoch=useRef(0);
  const pendingRequests=useRef(new Map());
  const pendingVisit=useRef(null);
  const [historyRevision,setHistoryRevision]=useState(0);
  const [visits,setVisits]=useState([]);
  const [reports,setReports]=useState([]);

  async function api(path, method = 'GET', body, t = token) {
    const epoch=sessionEpoch.current;
    let response;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),30000);
    const signature=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,method+path+JSON.stringify(body));
    const needsKey=method==='POST' && /\/(visits|reports)$/.test(path);
    if(needsKey&&!pendingRequests.current.has(signature))pendingRequests.current.set(signature,Crypto.randomUUID());
    try {
      response = await fetch(`${API_URL}${path}`, {
        method,
        signal:controller.signal,
        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...(needsKey?{'Idempotency-Key':pendingRequests.current.get(signature)}:{}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (_) { throw Error('Conexão interrompida ou lenta. Tente novamente; o registro será confirmado pelo servidor.'); } finally {clearTimeout(timeout);}
    const data = await response.json().catch(() => ({}));
    if(epoch!==sessionEpoch.current)throw Error('A sessão mudou. Entre novamente para continuar.');
    if (!response.ok) {if(response.status===401){sessionEpoch.current++;await session.clear();setToken('');setMe(null);setOrders([]);setCustomers([]);setTeam([]);setSelected(null);setVisits([]);setReports([]);setPhotos([]);setNotes('');setPassword('');setStats(null);setCustomerName('');setCustomerPhone('');setCustomerAddress('');setNewName('');setNewEmail('');setNewPassword('');setOrderTitle('');setDescription('');setCustomerId('');setTechId('');pendingRequests.current.clear();pendingVisit.current=null;} const err=Error(data.error || `Erro ${response.status}`);err.status=response.status;throw err;}
    pendingRequests.current.delete(signature);
    if(method!=='GET' && /\/(visits|reports)$/.test(path))setHistoryRevision(n=>n+1);
    if(Array.isArray(data))Object.defineProperty(data,'nextOffset',{value:response.headers.get('X-Next-Offset')});
    return data;
  }
  async function load(t = token, silent = false) {
    const epoch=sessionEpoch.current;
    try {
      const user = await api('/me', 'GET', undefined, t);
      const [os, dashboard, clients, people] = await Promise.all([
        api('/orders', 'GET', undefined, t),
        api('/dashboard', 'GET', undefined, t),
        api('/customers', 'GET', undefined, t),
        user.role === 'manager' ? api('/users', 'GET', undefined, t) : Promise.resolve([]),
      ]);
      if(epoch!==sessionEpoch.current)return false;
      setMe(user); setOrders(os); setStats(dashboard); setCustomers(clients); setTeam(people);
      return true;
    } catch (err) {
      if(epoch===sessionEpoch.current&&!silent) Alert.alert('Não foi possível atualizar', err.message);
      return false;
    }
  }
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.removeItem('ews_token'); // Discard the old plaintext session.
        const saved = await session.get();
        if (saved) { setToken(saved); await load(saved, true); }
      } catch (_) { Alert.alert('Sessão','Não foi possível recuperar a sessão. Entre novamente.'); } finally { setChecking(false); }
    })();
  }, []);
  async function login() {
    if (!email.trim() || !password) return Alert.alert('Acesso', 'Informe e-mail e senha.');
    setBusy(true);
    try {
      const result = await api('/auth/login', 'POST', { email: email.trim(), password }, '');
      sessionEpoch.current++;
      await session.set(result.token);
      setPassword('');
      setToken(result.token);
      await load(result.token);
    } catch (err) { Alert.alert('Não foi possível entrar', err.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    try {await api('/auth/logout','POST',{});} catch(e) {if(e.status!==401){Alert.alert('Não foi possível revogar a sessão',e.message);return;}}
    sessionEpoch.current++;
    await session.clear();setPhotos([]);setNotes('');setPassword('');setStats(null);setCustomerName('');setCustomerPhone('');setCustomerAddress('');setNewName('');setNewEmail('');setNewPassword('');setOrderTitle('');setDescription('');setCustomerId('');setTechId('');pendingRequests.current.clear();pendingVisit.current=null;setVisits([]);setReports([]);setPhotos([]);setNotes('');
    setToken(''); setMe(null); setTab('home'); setSelected(null);
    setPassword(''); setOrders([]); setStats(null); setCustomers([]); setTeam([]);
  }
  async function reload() { setRefreshing(true); await load(token); setRefreshing(false); }
  async function save(path, body, onSuccess, message = 'Registro salvo com sucesso.') {
    setBusy(true);
    try {
      await api(path, 'POST', body);
      await load(token, true);
      onSuccess?.(); Alert.alert('Tudo certo!', message);
    } catch (err) { Alert.alert('Não foi possível salvar', err.message); }
    finally { setBusy(false); }
  }
  async function takePhoto() {
    const epoch=sessionEpoch.current;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert('Câmera', 'Autorize o uso da câmera nas configurações.'); return null; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.35, base64: true });
    if(epoch!==sessionEpoch.current)return null;
    if (result.canceled || !result.assets?.[0]?.base64) return null;
    const a = result.assets[0];
    if(a.base64.length>2800000)throw Error('Foto muito grande. Tente novamente com uma resolução menor.');
    return `data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`;
  }
  async function visit(kind) {
    if (!selected) return;
    const epoch=sessionEpoch.current;
    setBusy(true);
    try {
      let body=pendingVisit.current?.order===selected.id && pendingVisit.current?.kind===kind ? pendingVisit.current.body : null;
      if(!body){
        Alert.alert('Privacidade','Localização e foto serão associadas a esta ordem e acessíveis aos gestores da empresa. Não há rastreamento contínuo.');
        const permission=await Location.requestForegroundPermissionsAsync();
        if(permission.status!=='granted')throw Error('Autorize a localização nas configurações para registrar a visita.');
        if(!(await Location.hasServicesEnabledAsync()))throw Error('Ative o serviço de localização do aparelho.');
        let timer;
        const location=await Promise.race([Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('O GPS demorou a responder. Tente em um local aberto.')),20000);})]).finally(()=>clearTimeout(timer));
        if(location.mocked)throw Error('Localização simulada não é aceita.');
        if(location.coords.accuracy==null||location.coords.accuracy>100)throw Error('GPS com baixa precisão. Aguarde o sinal melhorar e tente novamente.');
        const photo=await takePhoto();if(!photo||epoch!==sessionEpoch.current)return;
        body={kind,latitude:location.coords.latitude,longitude:location.coords.longitude,accuracy:location.coords.accuracy,photo_data:photo};
        pendingVisit.current={order:selected.id,kind,body};
      }
      await api(`/orders/${selected.id}/visits`,'POST',body);
      pendingVisit.current=null;
      await load(token, true);
      if (kind === 'checkin') setSelected(x => x ? { ...x, status: 'in_progress' } : x);
      Alert.alert('Registro confirmado', kind === 'checkin' ? 'Chegada registrada com localização e foto.' : 'Saída registrada com localização e foto.');
    } catch (err) { if(err.status>=400&&err.status<500&&err.status!==429)pendingVisit.current=null;Alert.alert('Falha no registro', err.message); }
    finally { setBusy(false); }
  }
  async function addPhoto() {
    if (photos.length >= 5) return Alert.alert('Limite atingido', 'São permitidas até 5 fotos.');
    try { const photo = await takePhoto(); if (photo) setPhotos(p => [...p, photo]); }
    catch (err) { Alert.alert('Câmera', err.message); }
  }
  async function finishReport() {
    if (notes.trim().length < 3) return Alert.alert('Relatório', 'Descreva o serviço realizado.');
    await save(`/orders/${selected.id}/reports`, {
      notes: notes.trim(), photos, checklist: [{ label: 'Atendimento realizado', done: true }],
    }, () => { setNotes(''); setPhotos([]); }, 'Relatório técnico enviado.');
  }
  async function changeStatus(status) {
    setBusy(true);
    try {
      await api(`/orders/${selected.id}/status`, 'PATCH', { status });
      await load(token, true);
      setSelected(null); Alert.alert('Ordem atualizada', 'O status foi atualizado com sucesso.');
    } catch (err) { Alert.alert('Erro', err.message); }
    finally { setBusy(false); }
  }
  const metrics = useMemo(() => {
    const total = stats?.total || 0;
    const count = status => stats?.byStatus.find(s=>s.status===status)?.total || 0;
    return { total, open: count('open') + count('assigned'), progress: count('in_progress'), completed: count('completed') };
  }, [stats]);
  const filteredOrders = useMemo(() => orders.filter(o => {
    const matchStatus = filter === 'all' || (filter === 'pending' ? ['open', 'assigned'].includes(o.status) : o.status === filter);
    const q = search.trim().toLowerCase();
    return matchStatus && (!q || `${o.title} ${o.customer_name || ''} ${o.technician_name || ''}`.toLowerCase().includes(q));
  }), [orders, filter, search]);
  async function moreList(path,current,setter){setBusy(true);try{const page=await api(`${path}?offset=${current.nextOffset}`);const joined=[...current,...page];Object.defineProperty(joined,'nextOffset',{value:page.nextOffset});setter(joined);}catch(e){Alert.alert('Não foi possível carregar',e.message);}finally{setBusy(false);}}
  useEffect(()=>{
    let active=true;setVisits([]);setReports([]);
    if(selected&&token)Promise.all([api(`/orders/${selected.id}/visits`),api(`/orders/${selected.id}/reports`)]).then(([v,r])=>{if(active){setVisits(v);setReports(r);}}).catch(e=>{if(active)Alert.alert('Histórico indisponível',e.message);});
    return ()=>{active=false;};
  },[selected?.id,selected?.status,historyRevision]);
  function navigate(target, subPage) {
    setSelected(null); setTab(target);
    if (target === 'manage') setManagePage(subPage || 'menu');
  }

  const tabs = [
    { key: 'home', name: 'Início', icon: 'home-outline', active: 'home' },
    { key: 'orders', name: 'Ordens', icon: 'reader-outline', active: 'reader' },
    ...(manager ? [{ key: 'manage', name: 'Gestão', icon: 'grid-outline', active: 'grid' }] : []),
    { key: 'profile', name: 'Perfil', icon: 'person-circle-outline', active: 'person-circle' },
  ];
  if (checking) return <View style={styles.splash}><View style={styles.splashLogo}><Icon name="layers" size={38} color="#FFF" /></View><Text style={styles.splashTitle}>EWS Field</Text><ActivityIndicator color={P.blue} style={{ marginTop: 28 }}/></View>;
  if (!me) return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: P.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.loginBrand}><View style={styles.brandIcon}><Icon name="layers" size={26} color="#FFF" /></View><Text style={styles.loginBrandText}>EWS <Text style={{ color: P.blue }}>Field</Text></Text></View>
        <View style={styles.loginHero}><View style={styles.loginGlow} /><Text style={styles.loginKicker}>GESTÃO DE CAMPO INTELIGENTE</Text><Text style={styles.loginTitle}>Sua operação, sob controle.</Text><Text style={styles.loginSubtitle}>Equipes conectadas. Atendimentos organizados. Resultados em tempo real.</Text><View style={styles.loginHeroIcon}><Icon name="analytics-outline" size={38} color="#FFF" /></View></View>
        <Card style={{ marginTop: -23, zIndex: 2, padding: 24 }}>
          <Text style={styles.authTitle}>Bem-vindo de volta</Text>
          <Text style={styles.authSubtitle}>Entre com suas credenciais para continuar.</Text>
          <Field label="E-mail corporativo" icon="mail-outline" placeholder="seuemail@empresa.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
          <Field label="Senha" icon="lock-closed-outline" placeholder="Sua senha" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"/>
          <TButton label={busy ? 'Entrando...' : 'Acessar plataforma'} icon="arrow-forward" disabled={busy} onPress={login} style={{ marginTop: 6 }}/>
        </Card>
        <Text style={styles.loginFooter}>EWS TECH  •  TECNOLOGIA PARA OPERAÇÕES REAIS</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
  return (
    <View style={styles.appRoot}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={P.blue} />}>
        {tab === 'home' && <>
          <View style={styles.hero}>
            <View style={styles.heroOrbOne}/><View style={styles.heroOrbTwo}/>
            <View style={styles.heroTop}><View style={styles.heroBrand}><View style={styles.heroBrandIcon}><Icon name="layers" size={19} color="#FFF" /></View><Text style={styles.heroBrandText}>EWS <Text style={{ fontWeight: '400' }}>Field</Text></Text></View><TouchableOpacity style={styles.heroAvatar} onPress={() => navigate('profile')}><Text style={styles.avatarText}>{initials(me.name)}</Text></TouchableOpacity></View>
            <Text style={styles.heroEyebrow}>{TODAY.toUpperCase()}  •  {manager ? 'VISÃO DO GESTOR' : 'MINHA OPERAÇÃO'}</Text>
            <Text style={styles.heroTitle}>Olá, {firstName(me.name)}! <Text style={{ color: '#8DA9FF' }}>✦</Text></Text>
            <Text style={styles.heroSubtitle}>{manager ? 'Veja como está sua operação hoje.' : 'Sua rotina de atendimentos, em um só lugar.'}</Text>
            <View style={styles.heroSummary}><View style={styles.heroSummaryIcon}><Icon name="pulse" size={20} color="#B9E9E5" /></View><View style={{ flex: 1 }}><Text style={styles.heroSummaryLabel}>STATUS DA OPERAÇÃO</Text><Text style={styles.heroSummaryValue}>{metrics.progress > 0 ? `${metrics.progress} atendimento(s) em execução` : 'Tudo pronto para começar'}</Text></View><Icon name="chevron-forward" color="#A8B7D0" size={18}/></View>
          </View>
          <View style={styles.mainPad}>
            <SectionHeader title="Visão geral" />
            <View style={styles.metricGrid}>
              <Metric label="Total de ordens" number={metrics.total} icon="document-text-outline" tint={P.blue} tone="#E9F0FF" />
              <Metric label="Pendentes" number={metrics.open} icon="time-outline" tint="#DC8B26" tone="#FFF2DE" />
              <Metric label="Em andamento" number={metrics.progress} icon="pulse-outline" tint="#13A396" tone="#E3F7F3" />
              <Metric label="Concluídas" number={metrics.completed} icon="checkmark-done-outline" tint="#14A573" tone="#E5F8EF" />
            </View>
            <SectionHeader title="Acesso rápido" />
            <View style={styles.actionGrid}>
              {manager && <Action label="Nova ordem" sub="Abrir atendimento" icon="add-circle-outline" onPress={() => navigate('manage', 'newOrder')} />}
              <Action label="Ordens" sub="Ver atendimentos" icon="reader-outline" onPress={() => navigate('orders')} />
              {manager && <Action label="Clientes" sub="Gerenciar cadastros" icon="people-outline" onPress={() => navigate('manage', 'customers')} />}
              {manager && <Action label="Equipe" sub="Colaboradores" icon="briefcase-outline" onPress={() => navigate('manage', 'team')} />}
            </View>
            <SectionHeader title="Atendimentos recentes" right="Ver todos" onRight={() => navigate('orders')} />
            {orders.length ? orders.slice(0, 3).map(o => <OrderCard key={o.id} order={o} onPress={() => { setTab('orders'); setSelected(o); }}/>) :
              <Empty icon="file-tray-outline" title="Nenhuma ordem por enquanto" subtitle="Quando os atendimentos forem criados, eles aparecerão aqui." action={manager ? 'Criar primeira ordem' : undefined} onAction={() => navigate('manage', 'newOrder')} />}
            {manager && <View style={styles.teamStrip}><View style={styles.teamStripIcon}><Icon name="people" size={23} color={P.blue} /></View><View style={{ flex: 1 }}><Text style={styles.teamStripTitle}>Sua equipe</Text><Text style={styles.teamStripSub}>{team.filter(x => x.role === 'technician' && x.active !== false).length} técnico(s) ativo(s)</Text></View><TouchableOpacity onPress={() => navigate('manage', 'team')}><Icon name="arrow-forward" color={P.blue}/></TouchableOpacity></View>}
          </View>
        </>}
        {tab === 'orders' && <View style={styles.mainPad}>
          <PageHeader eyebrow="CONTROLE OPERACIONAL" title={selected ? 'Detalhes da ordem' : 'Ordens de serviço'} subtitle={selected ? 'Acompanhe e registre este atendimento.' : `${orders.length} atendimento(s) registrado(s).`} onBack={selected ? () => setSelected(null) : null}/>
          {!selected ? <>
            <View style={styles.searchBar}><Icon name="search-outline" size={20} color={P.muted}/><TextInput value={search} onChangeText={setSearch} placeholder="Buscar ordem, cliente ou técnico" placeholderTextColor="#9AA6B6" style={styles.searchInput}/></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }} contentContainerStyle={{ gap: 8 }}>
              {[['all', 'Todas'], ['pending', 'Pendentes'], ['in_progress', 'Em andamento'], ['completed', 'Concluídas'], ['cancelled', 'Canceladas']].map(([key, label]) =>
                <TouchableOpacity key={key} onPress={() => setFilter(key)} style={[styles.filterChip, filter === key && styles.filterChipActive]}><Text style={[styles.filterText, filter === key && { color: '#FFF' }]}>{label}</Text></TouchableOpacity>)}
            </ScrollView>
            <SectionHeader title={`${filteredOrders.length} resultado(s)`} right={manager ? 'Nova ordem' : null} onRight={() => navigate('manage', 'newOrder')}/>
            {filteredOrders.length ? filteredOrders.map(o => <OrderCard key={o.id} order={o} onPress={() => { setSelected(o); setNotes(''); setPhotos([]); }}/>) :
              <Empty icon="search-outline" title="Nenhuma ordem encontrada" subtitle="Tente alterar a busca ou os filtros."/>}
          </> : <>
            <Card style={{ padding: 22 }}><StatusPill status={selected.status}/><Text style={[styles.detailTitle, { marginTop: 15 }]}>{selected.title}</Text>
              {!!selected.description && <Text style={styles.detailDescription}>{selected.description}</Text>}
              <View style={styles.detailDivider}/>
              <InfoRow icon="business-outline" label="Cliente" value={selected.customer_name}/>
              <InfoRow icon="person-outline" label="Técnico responsável" value={selected.technician_name || 'Não atribuído'}/>
              <InfoRow icon="calendar-outline" label="Agendamento" value={shortDate(selected.scheduled_at)}/>
            </Card>
            {manager && ['open','assigned'].includes(selected.status) && <Card><Text style={styles.fieldLabel}>Atribuir técnico</Text>{team.filter(u=>u.role==='technician'&&u.active).map(u=><Selectable key={u.id} label={u.name} active={selected.technician_id===u.id} icon="person-outline" onPress={async()=>{setBusy(true);try{const updated=await api(`/orders/${selected.id}/assignment`,'PATCH',{technician_id:u.id});await load(token,true);setSelected({...selected,...updated,technician_name:u.name});}catch(e){Alert.alert('Falha',e.message);}finally{setBusy(false);}}}/>)}</Card>}
            {!manager && !['completed', 'cancelled'].includes(selected.status) && <>
              <SectionHeader title="Registro em campo"/>
              <Card><View style={styles.featureRow}><View style={styles.featureIcon}><Icon name="location-outline" color={P.blue}/></View><View style={{ flex: 1 }}><Text style={styles.featureTitle}>Localização + evidência</Text><Text style={styles.featureSub}>Registre sua presença com GPS e fotografia.</Text></View></View>
                <TButton label="Registrar chegada" icon="log-in-outline" disabled={busy || visits[0]?.kind==='checkin'} onPress={() => visit('checkin')}/>
                <TButton label="Registrar saída" icon="log-out-outline" variant="outline" disabled={busy || visits[0]?.kind!=='checkin'} onPress={() => visit('checkout')}/>
              </Card>
              <SectionHeader title="Relatório técnico"/>
              <Card><Field label="Descrição do serviço" icon="create-outline" multiline placeholder="Descreva o que foi executado..." value={notes} onChangeText={setNotes}/><Text style={styles.fieldLabel}>Evidências fotográficas</Text>
                <TouchableOpacity onPress={addPhoto} style={styles.photoArea}><Icon name="camera-outline" size={27} color={P.blue}/><Text style={styles.photoTitle}>Adicionar fotografia</Text><Text style={styles.photoSub}>{photos.length} de 5 fotos anexadas</Text></TouchableOpacity>
                <TButton label={busy ? 'Salvando...' : 'Enviar relatório'} icon="cloud-upload-outline" disabled={busy} onPress={finishReport}/>
              </Card>
            </>}
            <SectionHeader title="Histórico do atendimento"/>
            {visits.nextOffset&&<TButton label="Carregar mais visitas" disabled={busy} onPress={()=>moreList(`/orders/${selected.id}/visits`,visits,setVisits)}/>}
            {reports.nextOffset&&<TButton label="Carregar mais relatórios" disabled={busy} onPress={()=>moreList(`/orders/${selected.id}/reports`,reports,setReports)}/>}
            {visits.map(v=><Card key={v.id}><Text style={styles.fieldLabel}>{v.kind==='checkin'?'Chegada':'Saída'} • {new Date(v.created_at).toLocaleString('pt-BR')}</Text>{v.has_photo&&<Image accessibilityLabel="Evidência da visita" source={{uri:`${API_URL}/orders/${selected.id}/visits/${v.id}/photo`,headers:{Authorization:`Bearer ${token}`}}} style={{height:180,borderRadius:12}}/>}</Card>)}
            {reports.map(r=><Card key={r.id}><Text style={styles.fieldLabel}>Relatório • {shortDate(r.created_at)}</Text><Text style={styles.detailDescription}>{r.notes}</Text>{(r.media_ids||[]).map(id=><Image key={id} accessibilityLabel="Evidência do relatório" source={{uri:`${API_URL}/orders/${selected.id}/media/${id}`,headers:{Authorization:`Bearer ${token}`}}} style={{height:180,marginTop:10,borderRadius:12}}/>)}</Card>)}
            {!['completed', 'cancelled'].includes(selected.status) && <Card><Text style={styles.fieldLabel}>Finalização da ordem</Text><Text style={[styles.detailDescription, { marginBottom: 15 }]}>Conclua a ordem após finalizar os registros necessários.</Text><TButton label="Marcar como concluída" icon="checkmark-circle-outline" variant="dark" disabled={busy} onPress={() => Alert.alert('Concluir ordem', 'Deseja marcar esta ordem como concluída?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Concluir', onPress: () => changeStatus('completed') }])}/></Card>}
          </>}
        </View>}
        {tab === 'manage' && manager && <View style={styles.mainPad}>
          <PageHeader eyebrow="CENTRAL ADMINISTRATIVA" title={managePage === 'menu' ? 'Gestão' : ({ customers: 'Clientes', team: 'Equipe', newOrder: 'Nova ordem' }[managePage])} subtitle={managePage === 'menu' ? 'Pessoas, clientes e operações organizados.' : 'Gerencie as informações da sua empresa.'} onBack={managePage !== 'menu' ? () => setManagePage('menu') : null}/>
          {managePage === 'menu' && <>
            <ManageLink icon="add-circle-outline" title="Criar ordem de serviço" sub="Abra um novo atendimento" onPress={() => setManagePage('newOrder')} color={P.blue}/>
            <ManageLink icon="business-outline" title="Clientes" sub={`${customers.length} cliente(s) cadastrado(s)`} onPress={() => setManagePage('customers')} color={P.teal}/>
            <ManageLink icon="people-outline" title="Equipe e acessos" sub={`${team.length} colaborador(es)`} onPress={() => setManagePage('team')} color={P.gold}/>
            <View style={styles.hintBox}><Icon name="shield-checkmark-outline" size={23} color={P.blue}/><Text style={styles.hintText}>Cada colaborador recebe acesso à sua empresa e às permissões do seu perfil.</Text></View>
          </>}
          {managePage === 'customers' && <>
            <Card><Text style={styles.formTitle}>Cadastrar cliente</Text><Text style={styles.formSubtitle}>Informações para abertura das ordens.</Text>
              <Field label="Nome do cliente *" icon="business-outline" placeholder="Nome da empresa ou cliente" value={customerName} onChangeText={setCustomerName}/>
              <Field label="Telefone" icon="call-outline" placeholder="(00) 00000-0000" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad"/>
              <Field label="Endereço" icon="location-outline" placeholder="Rua, número e cidade" value={customerAddress} onChangeText={setCustomerAddress}/>
              <TButton label="Salvar cliente" icon="add-outline" disabled={busy || customerName.trim().length < 2} onPress={() => save('/customers', { name: customerName.trim(), phone: customerPhone.trim(), address: customerAddress.trim() }, () => { setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); })}/>
            </Card>
            <SectionHeader title={`Clientes cadastrados (${customers.length})`}/>
            {customers.length ? customers.map(c => <Card key={c.id} style={styles.listRow}><View style={[styles.listAvatar, { backgroundColor: '#E8F7F4' }]}><Icon name="business" color="#139B8F"/></View><View style={{ flex: 1 }}><Text style={styles.listName}>{c.name}</Text><Text style={styles.listSub}>{c.phone || c.address || 'Sem contato adicional'}</Text></View></Card>) : <Empty icon="business-outline" title="Sem clientes" subtitle="Cadastre seu primeiro cliente acima."/>}
          </>}
          {managePage === 'team' && <>
            <Card><Text style={styles.formTitle}>Adicionar colaborador</Text><Text style={styles.formSubtitle}>Crie um acesso para um novo membro da equipe.</Text>
              <Field label="Nome completo *" icon="person-outline" placeholder="Nome e sobrenome" value={newName} onChangeText={setNewName}/>
              <Field label="E-mail *" icon="mail-outline" placeholder="colaborador@empresa.com" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none"/>
              <Field label="Senha inicial *" icon="lock-closed-outline" placeholder="No mínimo 12 caracteres" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none"/>
              <Text style={styles.fieldLabel}>Perfil de acesso</Text><View style={styles.roleRow}>{[['technician', 'Técnico', 'construct-outline'], ['manager', 'Gestor', 'shield-outline']].map(([role, text, icon]) => <TouchableOpacity key={role} onPress={() => setNewRole(role)} style={[styles.roleItem, newRole === role && styles.roleItemActive]}><Icon name={icon} color={newRole === role ? P.blue : P.muted}/><Text style={[styles.roleText, newRole === role && { color: P.blue }]}>{text}</Text></TouchableOpacity>)}</View>
              <TButton label="Cadastrar colaborador" icon="person-add-outline" disabled={busy || newName.trim().length < 2 || !newEmail.includes('@') || newPassword.length < 12} onPress={() => save('/users', { name: newName.trim(), email: newEmail.trim(), password: newPassword, role: newRole }, () => { setNewName(''); setNewEmail(''); setNewPassword(''); })}/>
            </Card>
            <SectionHeader title={`Membros da equipe (${team.length})`}/>
            {team.map(u => <Card key={u.id} style={styles.listRow}><View style={styles.listAvatar}><Text style={styles.listAvatarText}>{initials(u.name)}</Text></View><View style={{ flex: 1 }}><Text style={styles.listName}>{u.name}</Text><Text style={styles.listSub}>{u.email}</Text></View><View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{u.role === 'manager' ? 'Gestor' : 'Técnico'}</Text></View></Card>)}
          </>}
          {managePage === 'newOrder' && <Card><Text style={styles.formTitle}>Novo atendimento</Text><Text style={styles.formSubtitle}>Preencha os dados para abrir uma ordem.</Text>
            <Field label="Título da ordem *" icon="reader-outline" placeholder="Ex.: Manutenção de painel elétrico" value={orderTitle} onChangeText={setOrderTitle}/>
            <Field label="Descrição" icon="create-outline" multiline placeholder="Detalhes do serviço solicitado..." value={description} onChangeText={setDescription}/>
            <Text style={styles.fieldLabel}>Selecione o cliente *</Text>
            {customers.length ? customers.map(c => <Selectable key={c.id} label={c.name} active={customerId === c.id} icon="business-outline" onPress={() => setCustomerId(c.id)}/>) : <Text style={styles.helperText}>Nenhum cliente cadastrado. Cadastre um cliente primeiro.</Text>}
            <Text style={[styles.fieldLabel, { marginTop: 15 }]}>Responsável técnico (opcional)</Text>
            <Selectable label="Atribuir depois" active={!techId} icon="remove-circle-outline" onPress={() => setTechId('')}/>
            {team.filter(u => u.role === 'technician' && u.active !== false).map(u => <Selectable key={u.id} label={u.name} active={techId === u.id} icon="person-outline" onPress={() => setTechId(u.id)}/>)}
            {customers.nextOffset&&<TButton label="Carregar mais clientes" disabled={busy} onPress={()=>moreList('/customers',customers,setCustomers)}/>}
            {team.nextOffset&&<TButton label="Carregar mais técnicos" disabled={busy} onPress={()=>moreList('/users',team,setTeam)}/>}
            <TButton label="Criar ordem de serviço" icon="add-outline" disabled={busy || orderTitle.trim().length < 3 || !customerId} style={{ marginTop: 16 }} onPress={() => save('/orders', { title: orderTitle.trim(), description: description.trim(), customer_id: customerId, technician_id: techId || null }, () => { setOrderTitle(''); setDescription(''); setCustomerId(''); setTechId(''); navigate('orders'); }, 'A ordem foi criada e já aparece na lista de atendimentos.')}/>
          </Card>}
        </View>}
        {tab === 'profile' && <View style={styles.mainPad}>
          <PageHeader eyebrow="MINHA CONTA" title="Perfil" subtitle="Suas informações e acesso à plataforma."/>
          <Card style={{ alignItems: 'center', paddingVertical: 30 }}><View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{initials(me.name)}</Text></View><Text style={styles.profileName}>{me.name}</Text><Text style={styles.profileRole}>{manager ? 'Administrador / Gestor' : 'Técnico de campo'}</Text><View style={[styles.roleBadge, { marginTop: 14 }]}><Icon name="checkmark-circle" size={14} color={P.green}/><Text style={[styles.roleBadgeText, { color: P.green }]}>Conta ativa</Text></View></Card>
          <Card><InfoRow icon="mail-outline" label="E-mail" value={me.email}/><View style={styles.detailDivider}/><InfoRow icon="shield-outline" label="Permissão" value={manager ? 'Gestor' : 'Técnico'}/><View style={styles.detailDivider}/><InfoRow icon="cloud-done-outline" label="Plataforma" value="EWS Field"/></Card>
          <TButton label="Sair da minha conta" icon="log-out-outline" variant="outline" onPress={() => Alert.alert('Sair', 'Deseja encerrar sua sessão?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: logout }])}/>
          <Text style={styles.profileFooter}>EWS FIELD  •  VERSÃO 2.0</Text>
        </View>}
        {tab==='orders'&&!selected&&orders.nextOffset&&<TButton label="Carregar mais ordens" disabled={busy} onPress={()=>moreList('/orders',orders,setOrders)}/>}
        {tab==='manage'&&managePage==='customers'&&customers.nextOffset&&<TButton label="Carregar mais clientes" disabled={busy} onPress={()=>moreList('/customers',customers,setCustomers)}/>}
        {tab==='manage'&&managePage==='team'&&team.nextOffset&&<TButton label="Carregar mais equipe" disabled={busy} onPress={()=>moreList('/users',team,setTeam)}/>}
      </ScrollView>
      <View style={styles.tabBar}>{tabs.map(item => <TouchableOpacity key={item.key} activeOpacity={0.8} onPress={() => navigate(item.key)} style={styles.tabItem}>
        <View style={[styles.tabIcon, tab === item.key && styles.tabIconActive]}><Icon name={tab === item.key ? item.active : item.icon} size={22} color={tab === item.key ? P.blue : '#8C9AAF'}/></View>
        <Text style={[styles.tabLabel, tab === item.key && { color: P.blue, fontWeight: '800' }]}>{item.name}</Text>
      </TouchableOpacity>)}</View>
      {busy && <View pointerEvents="none" style={styles.busyIndicator}><ActivityIndicator color={P.blue} size="small"/></View>}
    </View>
  );
}
function Metric({ label, number, icon, tint, tone }) {
  return <View style={styles.metricCard}><View style={[styles.metricIcon, { backgroundColor: tone }]}><Icon name={icon} color={tint} size={23}/></View><Text style={styles.metricNumber}>{number}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}
function Action({ label, sub, icon, onPress }) {
  return <TouchableOpacity activeOpacity={0.82} style={styles.actionCard} onPress={onPress}><View style={styles.actionIcon}><Icon name={icon} color={P.blue} size={22}/></View><Text style={styles.actionLabel}>{label}</Text><Text style={styles.actionSub}>{sub}</Text><Icon name="arrow-forward" size={17} color="#94A3B8"/></TouchableOpacity>;
}
function PageHeader({ eyebrow, title, subtitle, onBack }) {
  return <View style={styles.pageHeader}>{onBack && <TouchableOpacity onPress={onBack} style={styles.backCircle}><Icon name="arrow-back" color={P.navy}/></TouchableOpacity>}<Text style={styles.pageEyebrow}>{eyebrow}</Text><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageSub}>{subtitle}</Text></View>;
}
function InfoRow({ icon, label, value }) {
  return <View style={styles.infoRow}><View style={styles.infoIcon}><Icon name={icon} size={18} color={P.blue}/></View><View style={{ flex: 1 }}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value || 'Não informado'}</Text></View></View>;
}
function ManageLink({ icon, title, sub, color, onPress }) {
  return <TouchableOpacity style={styles.manageLink} activeOpacity={0.85} onPress={onPress}><View style={[styles.manageIcon, { backgroundColor: color + '16' }]}><Icon name={icon} color={color} size={26}/></View><View style={{ flex: 1 }}><Text style={styles.manageTitle}>{title}</Text><Text style={styles.manageSub}>{sub}</Text></View><Icon name="chevron-forward" color={P.muted} size={21}/></TouchableOpacity>;
}
function Selectable({ label, active, icon, onPress }) {
  return <TouchableOpacity onPress={onPress} style={[styles.selectable, active && styles.selectableActive]}><Icon name={icon} size={19} color={active ? P.blue : P.muted}/><Text style={[styles.selectableText, active && { color: P.blue }]}>{label}</Text><Icon name={active ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={active ? P.blue : '#CDD5E1'}/></TouchableOpacity>;
}
export default function App() {
  return <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: P.bg }} edges={['top', 'bottom']}><RNStatusBar barStyle="dark-content" backgroundColor={P.bg}/><AppContent/></SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: P.bg },
  scrollContent: { paddingBottom: 24, flexGrow: 1 },
  mainPad: { paddingHorizontal: 20, paddingTop: 24 },
  card: { padding: 19, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, borderRadius: 21, marginBottom: 14 },
  button: { minHeight: 52, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 8, paddingHorizontal: 17 },
  buttonSmall: { minHeight: 41, paddingHorizontal: 14, alignSelf: 'center' },
  buttonText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#536176', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', gap: 10, alignItems: 'center', borderColor: '#DDE5F0', borderWidth: 1, borderRadius: 12, backgroundColor: '#FAFCFF', paddingLeft: 14, paddingRight: 10 },
  input: { flex: 1, paddingVertical: 13, minHeight: 48, fontSize: 14, color: P.text },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 15 },
  sectionTitle: { color: P.navy, fontWeight: '900', fontSize: 18, letterSpacing: -0.3 },
  sectionLink: { color: P.blue, fontSize: 12, fontWeight: '800' },
  pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: '800' },
  orderCard: { backgroundColor: P.white, borderWidth: 1, borderColor: P.line, borderRadius: 19, padding: 17, marginBottom: 12 },
  orderDate: { fontSize: 11, fontWeight: '600', color: P.muted, marginTop: 7 },
  orderTitle: { color: P.navy, fontSize: 17, fontWeight: '900', marginTop: 15, marginBottom: 10 },
  orderInfo: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  orderInfoText: { color: '#758397', fontSize: 12, flexShrink: 1 },
  orderFooter: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: P.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 34 },
  emptyIcon: { width: 66, height: 66, borderRadius: 21, backgroundColor: P.pale, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: P.navy, textAlign: 'center' },
  emptySub: { fontSize: 12, lineHeight: 19, color: P.muted, marginTop: 7, textAlign: 'center', paddingHorizontal: 15 },
  hero: { backgroundColor: P.navy, paddingHorizontal: 23, paddingTop: 26, paddingBottom: 27, borderBottomLeftRadius: 29, borderBottomRightRadius: 29, overflow: 'hidden' },
  heroOrbOne: { position: 'absolute', width: 215, height: 215, borderRadius: 120, right: -120, top: -65, borderWidth: 42, borderColor: 'rgba(83,129,233,0.15)' },
  heroOrbTwo: { position: 'absolute', width: 145, height: 145, borderRadius: 80, left: -110, bottom: -80, backgroundColor: 'rgba(37,99,235,0.20)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 },
  heroBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroBrandIcon: { backgroundColor: P.blue, width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  heroBrandText: { fontSize: 19, fontWeight: '900', color: '#FFF', letterSpacing: -0.6 },
  heroAvatar: { width: 41, height: 41, borderRadius: 15, backgroundColor: '#304565', borderWidth: 1, borderColor: '#56647B', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  heroEyebrow: { color: '#95AACC', fontWeight: '800', fontSize: 10, letterSpacing: 1.2, marginBottom: 9 },
  heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.9 },
  heroSubtitle: { color: '#B8C7DF', fontSize: 13, marginTop: 8, lineHeight: 20 },
  heroSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 28, backgroundColor: 'rgba(255,255,255,0.075)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  heroSummaryIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: 'rgba(34,184,174,0.17)', justifyContent: 'center', alignItems: 'center' },
  heroSummaryLabel: { color: '#92AACD', fontSize: 9, letterSpacing: 1.2, fontWeight: '900', marginBottom: 5 },
  heroSummaryValue: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 11, marginBottom: 18 },
  metricCard: { width: '48.4%', backgroundColor: '#FFF', padding: 17, borderRadius: 19, borderWidth: 1, borderColor: P.line, minHeight: 156 },
  metricIcon: { width: 41, height: 41, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  metricNumber: { fontSize: 29, color: P.navy, fontWeight: '900', marginTop: 10, letterSpacing: -0.6 },
  metricLabel: { fontSize: 11, fontWeight: '600', color: P.muted, marginTop: 1 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 18 },
  actionCard: { width: '48.4%', backgroundColor: '#FFF', borderRadius: 18, padding: 16, minHeight: 147, borderWidth: 1, borderColor: P.line, alignItems: 'flex-start' },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: P.pale, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { color: P.navy, fontSize: 14, fontWeight: '900' },
  actionSub: { fontSize: 10, color: P.muted, marginTop: 4, marginBottom: 9 },
  teamStrip: { backgroundColor: '#EDF2FF', borderRadius: 17, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 5, marginBottom: 10 },
  teamStripIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DAE6FF' },
  teamStripTitle: { color: P.navy, fontWeight: '900', fontSize: 13 },
  teamStripSub: { color: '#6980A3', fontSize: 11, marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: P.line, paddingTop: 9, paddingBottom: 7, paddingHorizontal: 8 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabIcon: { width: 49, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  tabIconActive: { backgroundColor: P.pale },
  tabLabel: { color: '#94A1B2', fontWeight: '700', fontSize: 10, marginTop: 4 },
  pageHeader: { marginBottom: 24 },
  pageEyebrow: { color: P.blue, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 9 },
  pageTitle: { fontSize: 28, letterSpacing: -0.8, color: P.navy, fontWeight: '900' },
  pageSub: { fontSize: 13, color: P.muted, marginTop: 8, lineHeight: 20 },
  backCircle: { alignSelf: 'flex-start', width: 37, height: 37, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8EEF8', borderRadius: 11, marginBottom: 19 },
  searchBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: P.line, backgroundColor: '#FFF', borderRadius: 14, alignItems: 'center', marginBottom: 17 },
  searchInput: { minHeight: 51, flex: 1, fontSize: 13, color: P.text },
  filterChip: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 11, backgroundColor: '#FFF', borderWidth: 1, borderColor: P.line },
  filterChipActive: { backgroundColor: P.blue, borderColor: P.blue },
  filterText: { color: P.muted, fontSize: 11, fontWeight: '800' },
  detailTitle: { color: P.navy, fontWeight: '900', fontSize: 23, letterSpacing: -0.6, marginBottom: 10 },
  detailDescription: { fontSize: 12, color: P.muted, lineHeight: 19 },
  detailDivider: { height: 1, backgroundColor: P.line, marginVertical: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  infoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: P.pale, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: P.muted, fontSize: 10, marginBottom: 4 },
  infoValue: { color: P.navy, fontSize: 13, fontWeight: '800' },
  featureRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 18 },
  featureIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: P.pale, justifyContent: 'center', alignItems: 'center' },
  featureTitle: { fontSize: 13, fontWeight: '900', color: P.navy },
  featureSub: { color: P.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  photoArea: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#B5C9ED', borderRadius: 13, padding: 22, backgroundColor: '#F8FAFF', alignItems: 'center', marginBottom: 17 },
  photoTitle: { color: P.navy, fontSize: 12, fontWeight: '900', marginTop: 8 },
  photoSub: { color: P.muted, fontSize: 11, marginTop: 3 },
  manageLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, padding: 17, gap: 13, borderWidth: 1, borderColor: P.line, marginBottom: 12 },
  manageIcon: { width: 52, height: 52, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  manageTitle: { fontSize: 14, fontWeight: '900', color: P.navy },
  manageSub: { fontSize: 11, color: P.muted, marginTop: 5 },
  hintBox: { flexDirection: 'row', gap: 11, backgroundColor: P.pale, borderRadius: 15, padding: 17, marginTop: 14 },
  hintText: { flex: 1, fontSize: 11, lineHeight: 18, color: '#58749E' },
  formTitle: { fontSize: 19, fontWeight: '900', color: P.navy },
  formSubtitle: { color: P.muted, fontSize: 12, marginTop: 5, marginBottom: 24, lineHeight: 18 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13 },
  listAvatar: { width: 43, height: 43, borderRadius: 14, backgroundColor: P.pale, justifyContent: 'center', alignItems: 'center' },
  listAvatarText: { color: P.blue, fontSize: 13, fontWeight: '900' },
  listName: { fontSize: 13, fontWeight: '900', color: P.navy },
  listSub: { color: P.muted, fontSize: 11, marginTop: 5 },
  roleBadge: { flexDirection: 'row', gap: 5, backgroundColor: '#EDF7F2', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center' },
  roleBadgeText: { color: '#278B68', fontSize: 10, fontWeight: '800' },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 21 },
  roleItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: P.line, backgroundColor: '#FAFCFF', paddingVertical: 14, borderRadius: 12 },
  roleItemActive: { borderColor: P.blue, backgroundColor: P.pale },
  roleText: { color: P.muted, fontSize: 12, fontWeight: '800' },
  selectable: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 47, paddingHorizontal: 11, borderWidth: 1, borderColor: P.line, borderRadius: 11, marginBottom: 8, backgroundColor: '#FAFCFF' },
  selectableActive: { borderColor: P.blue, backgroundColor: '#EFF4FF' },
  selectableText: { flex: 1, fontSize: 12, fontWeight: '700', color: P.text },
  helperText: { color: P.muted, fontSize: 12, marginVertical: 14 },
  profileAvatar: { width: 82, height: 82, borderRadius: 27, backgroundColor: P.blue, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 29, fontWeight: '900', color: '#FFF' },
  profileName: { marginTop: 17, fontSize: 21, color: P.navy, fontWeight: '900' },
  profileRole: { color: P.muted, marginTop: 7, fontSize: 12 },
  profileFooter: { textAlign: 'center', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: '#A3AFC0', marginTop: 18 },
  splash: { flex: 1, backgroundColor: P.bg, justifyContent: 'center', alignItems: 'center' },
  splashLogo: { width: 72, height: 72, borderRadius: 22, backgroundColor: P.blue, justifyContent: 'center', alignItems: 'center' },
  splashTitle: { marginTop: 17, fontSize: 26, fontWeight: '900', color: P.navy },
  loginScroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 27 },
  loginBrand: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 25 },
  brandIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: P.blue, alignItems: 'center', justifyContent: 'center' },
  loginBrandText: { color: P.navy, fontSize: 24, fontWeight: '900', letterSpacing: -0.7 },
  loginHero: { backgroundColor: P.navy, borderRadius: 23, overflow: 'hidden', paddingHorizontal: 23, paddingTop: 30, paddingBottom: 66, minHeight: 246 },
  loginGlow: { position: 'absolute', width: 160, height: 160, borderRadius: 90, backgroundColor: 'rgba(37,99,235,0.19)', right: -70, top: -70 },
  loginKicker: { fontSize: 9, fontWeight: '900', color: '#96B8F6', letterSpacing: 1.3, marginBottom: 13 },
  loginTitle: { fontSize: 28, fontWeight: '900', lineHeight: 34, color: '#FFF', maxWidth: 260, letterSpacing: -1 },
  loginSubtitle: { color: '#B6C5DD', fontSize: 12, lineHeight: 19, maxWidth: 230, marginTop: 12 },
  loginHeroIcon: { position: 'absolute', right: 20, bottom: 23, opacity: 0.37 },
  authTitle: { fontSize: 21, fontWeight: '900', color: P.navy },
  authSubtitle: { color: P.muted, fontSize: 12, marginTop: 7, marginBottom: 24 },
  loginFooter: { textAlign: 'center', color: '#A4AFC0', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 25 },
  busyIndicator: { position: 'absolute', right: 15, bottom: 79, padding: 10, borderRadius: 17, backgroundColor: '#FFF', borderWidth: 1, borderColor: P.line },
});
