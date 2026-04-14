
import * as React from 'react';
import { Brand, HotelUnit, Suite, PricingData, SuiteCategoryImage, ExtraItem } from '../types.ts';
import { brandService } from '../services/brandService.ts';
import { suiteService } from '../services/suiteService.ts';
import { hotelUnitService } from '../services/hotelUnitService.ts';
import { pricingService } from '../services/pricingService.ts';
import { extraService } from '../services/extraService.ts';
import { supabase } from '../supabaseClient.ts';
import FormField from './FormField.tsx';
import { Button } from './ui/button.tsx';
import { cn } from '../lib/utils.ts';
import SelectField from './SelectField.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  LogOut, 
  LayoutDashboard, 
  Building2, 
  Hotel, 
  BedDouble, 
  DollarSign, 
  Sparkles, 
  Settings, 
  Loader2,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface AdminPageProps {
  onNavigateToReservation: () => void;
  currentConfig: { title: string; subtitle: string };
  onSaveConfig: (config: { title: string; subtitle: string }) => void;
}

type AdminTab = 'brands' | 'units' | 'suites' | 'prices' | 'extras' | 'settings';

const AdminPage: React.FC<AdminPageProps> = ({ onNavigateToReservation, currentConfig, onSaveConfig }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<AdminTab>('brands');
  const [isLoading, setIsLoading] = React.useState<boolean>(true); // Start as true to check session
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [saveStatus, setSaveStatus] = React.useState<{ message: string; type: 'success' | 'error'} | null>(null);

  // Local settings state for the form
  const [localSettings, setLocalSettings] = React.useState(currentConfig);

  // Brands state
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null);
  const [currentBrand, setCurrentBrand] = React.useState<Partial<Omit<Brand, 'id'>>>({ name: '', suite_categories: [], stay_durations: [] });
  const [brandFormVisible, setBrandFormVisible] = React.useState(false);

  // Unit state
  const [units, setUnits] = React.useState<HotelUnit[]>([]);
  const [editingUnit, setEditingUnit] = React.useState<HotelUnit | null>(null);
  const [currentUnit, setCurrentUnit] = React.useState<Partial<Omit<HotelUnit, 'id'>> & { visible_suite_categories?: string[], suite_category_images?: SuiteCategoryImage[] }>({ name: '', brandId: undefined, visible_suite_categories: [], suite_category_images: [] });
  const [unitFormVisible, setUnitFormVisible] = React.useState(false);
  
  // Suite state
  const [suites, setSuites] = React.useState<Suite[]>([]);
  const [editingSuite, setEditingSuite] = React.useState<Suite | null>(null);
  const [currentSuite, setCurrentSuite] = React.useState<Partial<Omit<Suite, 'id'>>>({ api_id: undefined, name: '', category: '', unitIds: [] });
  const [suiteFormVisible, setSuiteFormVisible] = React.useState(false);

  // Pricing state
  const [selectedBrandForPricing, setSelectedBrandForPricing] = React.useState<string>('');
  const [pricingData, setPricingData] = React.useState<PricingData | null>(null);
  const [isPricingLoading, setIsPricingLoading] = React.useState<boolean>(false);

  // Extras state
  const [extras, setExtras] = React.useState<ExtraItem[]>([]);
  const [editingExtra, setEditingExtra] = React.useState<ExtraItem | null>(null);
  const [extraFormVisible, setExtraFormVisible] = React.useState(false);
  const [currentExtra, setCurrentExtra] = React.useState<Partial<ExtraItem>>({
    title: '', price: 0, description: '', image: '', category: '', tag: '', active: true, order: 0
  });

  // Check for active session on mount
  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      }
      setIsLoading(false); // Stop loading after checking session
    };
    checkSession();
  }, []);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
        const [brandsData, unitsData, suitesData] = await Promise.all([
            brandService.getAllBrands(),
            hotelUnitService.getAllUnits(),
            suiteService.getAllSuites()
        ]);
        setBrands(brandsData);
        setUnits(unitsData);
        setSuites(suitesData);
        setExtras(extraService.getExtras().sort((a, b) => a.order - b.order)); // Load extras from LocalStorage

        if (brandsData.length > 0 && !selectedBrandForPricing) {
            setSelectedBrandForPricing(String(brandsData[0].id));
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar dados.');
    } finally {
        setIsLoading(false);
    }
  }, [selectedBrandForPricing]);
  
  React.useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Load pricing data when selected brand changes
  React.useEffect(() => {
      if (selectedBrandForPricing && activeTab === 'prices' && isAuthenticated) {
          const brandId = parseInt(selectedBrandForPricing, 10);
          const fetchPricing = async () => {
              setIsPricingLoading(true);
              setPricingData(null);
              try {
                  const data = await pricingService.getPricingData(brandId);
                  setPricingData(data);
              } catch (err) {
                  setError(err instanceof Error ? err.message : 'Falha ao carregar preços.');
              } finally {
                  setIsPricingLoading(false);
              }
          };
          fetchPricing();
      }
  }, [selectedBrandForPricing, activeTab, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      setIsAuthenticated(true);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.error_description || err.message || 'E-mail ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const showSaveStatus = (message: string, type: 'success' | 'error') => {
    setSaveStatus({ message, type });
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(localSettings);
    showSaveStatus('Configurações salvas localmente!', 'success');
  };
  
  // --- Brand Handlers ---
  const handleBrandFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBrand.name) {
      setError('O nome da marca é obrigatório.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        name: currentBrand.name,
        suite_categories: Array.isArray(currentBrand.suite_categories) ? currentBrand.suite_categories.filter(c => c) : [],
        stay_durations: Array.isArray(currentBrand.stay_durations) ? currentBrand.stay_durations.filter(d => d) : [],
      };
      if (editingBrand) {
        await brandService.updateBrand({ ...editingBrand, ...payload });
        showSaveStatus('Marca atualizada com sucesso!', 'success');
      } else {
        await brandService.addBrand(payload);
        showSaveStatus('Marca adicionada com sucesso!', 'success');
      }
      setBrandFormVisible(false);
      setEditingBrand(null);
      await loadData();
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar marca.');
    } finally {
      setIsSaving(false);
    }
  };
  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setCurrentBrand({
      name: brand.name,
      suite_categories: brand.suite_categories,
      stay_durations: brand.stay_durations,
    });
    setBrandFormVisible(true);
    setError('');
  };
  const handleDeleteBrand = async (brandId: number) => {
    if (window.confirm('Tem certeza? Remover uma marca também removerá suas unidades e preços.')) {
      try {
        await brandService.deleteBrand(brandId);
        showSaveStatus('Marca removida com sucesso.', 'success');
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao remover marca.');
      }
    }
  };

  // --- Unit Handlers ---
  const handleCategoryImageURLChange = (category: string, url: string, index: number) => {
      setCurrentUnit(prev => {
          const updatedImages = [...(prev.suite_category_images || [])];
          let categoryImages = updatedImages.find(ci => ci.category === category);

          if (!categoryImages) {
              categoryImages = { category: category, imageUrls: [] };
              updatedImages.push(categoryImages);
          }
          
          const newImageUrls = [...categoryImages.imageUrls];
          newImageUrls[index] = url;
          categoryImages.imageUrls = newImageUrls;

          return { ...prev, suite_category_images: updatedImages };
      });
  };

  const handleUnitFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUnit.name || !currentUnit.brandId) {
        setError('Nome da unidade e seleção de marca são obrigatórios.');
        return;
    }
    setIsSaving(true);
    setError('');
    try {
      const payload = {
          name: currentUnit.name,
          brandId: currentUnit.brandId,
          visible_suite_categories: currentUnit.visible_suite_categories || [],
          suite_category_images: currentUnit.suite_category_images || []
      };
      if (editingUnit) {
        await hotelUnitService.updateUnit({ ...editingUnit, ...payload });
        showSaveStatus('Unidade atualizada!', 'success');
      } else {
        await hotelUnitService.addUnit(payload);
        showSaveStatus('Unidade adicionada!', 'success');
      }
      setUnitFormVisible(false);
      setEditingUnit(null);
      await loadData();
    } catch(err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar unidade.');
    } finally {
      setIsSaving(false);
    }
  };
  const handleEditUnit = (unit: HotelUnit) => {
    setEditingUnit(unit);
    setCurrentUnit({
        name: unit.name,
        brandId: unit.brandId,
        visible_suite_categories: unit.visible_suite_categories || [],
        suite_category_images: unit.suite_category_images || []
    });
    setUnitFormVisible(true);
    setError('');
  };
  const handleDeleteUnit = async (unitId: number) => {
    if (window.confirm('Tem certeza?')) {
      try {
        await hotelUnitService.deleteUnit(unitId);
        showSaveStatus('Unidade removida.', 'success');
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao remover unidade.');
      }
    }
  };
  
  const handleCategoryVisibilityChange = (category: string, isChecked: boolean) => {
    setCurrentUnit(prev => {
        const currentCategories = prev.visible_suite_categories || [];
        if (isChecked) {
            return { ...prev, visible_suite_categories: [...currentCategories, category] };
        } else {
            return { ...prev, visible_suite_categories: currentCategories.filter(c => c !== category) };
        }
    });
  };

  // --- Suite Handlers ---
    const handleSuiteUnitAssignmentChange = (unitId: number, isChecked: boolean) => {
        setCurrentSuite(prev => {
            const currentUnitIds = prev.unitIds || [];
            if (isChecked) {
                return { ...prev, unitIds: [...currentUnitIds, unitId] };
            } else {
                return { ...prev, unitIds: currentUnitIds.filter(id => id !== unitId) };
            }
        });
    };

  const handleSuiteFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentSuite.api_id || !currentSuite.name || !currentSuite.category) {
          setError('Todos os campos da suíte são obrigatórios.');
          return;
      }
      setIsSaving(true);
      setError('');
      try {
          const payload = { 
              api_id: currentSuite.api_id, 
              name: currentSuite.name, 
              category: currentSuite.category,
              unitIds: currentSuite.unitIds || []
          };
          if (editingSuite) {
              await suiteService.updateSuite({ ...editingSuite, ...payload });
              showSaveStatus('Suíte atualizada!', 'success');
          } else {
              await suiteService.addSuite(payload);
              showSaveStatus('Suíte adicionada!', 'success');
          }
          setSuiteFormVisible(false);
          setEditingSuite(null);
          await loadData();
      } catch(err) {
          setError(err instanceof Error ? err.message : 'Erro ao salvar suíte.');
      } finally {
          setIsSaving(false);
      }
  };
  const handleEditSuite = (suite: Suite) => {
      setEditingSuite(suite);
      setCurrentSuite({ api_id: suite.api_id, name: suite.name, category: suite.category, unitIds: suite.unitIds || [] });
      setSuiteFormVisible(true);
      setError('');
  };
  const handleDeleteSuite = async (suiteId: number) => {
      if (window.confirm('Tem certeza?')) {
          try {
              await suiteService.deleteSuite(suiteId);
              showSaveStatus('Suíte removida.', 'success');
              await loadData();
          } catch(err) {
              setError(err instanceof Error ? err.message : 'Erro ao remover suíte.');
          }
      }
  };

  // --- Pricing Handlers ---
  const handlePriceChange = (dayRange: string, category: string, duration: string, value: string) => {
    setPricingData(prevData => {
        if (!prevData) return null;
        const newData = JSON.parse(JSON.stringify(prevData));
        const price = parseFloat(value);
        newData[dayRange][category][duration] = isNaN(price) ? 0 : price;
        return newData;
    });
  };
  const handleSavePrices = async () => {
    if (pricingData && selectedBrandForPricing) {
        setIsSaving(true);
        try {
            await pricingService.savePricingData(parseInt(selectedBrandForPricing, 10), pricingData);
            showSaveStatus('Preços salvos com sucesso!', 'success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar preços.');
        } finally {
            setIsSaving(false);
        }
    }
  };
  
  const renderPricingContent = () => {
    const selectedBrand = selectedBrandForPricing ? brands.find(b => b.id === parseInt(selectedBrandForPricing, 10)) : null;

    if (!selectedBrand) {
        return <p className="mt-4 text-slate-500">Por favor, selecione uma marca para gerenciar os preços.</p>;
    }
    
    if (isPricingLoading) {
        return <p className="mt-4 text-slate-500">Carregando tabela de preços...</p>
    }

    if (!pricingData) {
        return <p className="mt-4 text-red-500">Não foi possível carregar os dados de preços. Tente selecionar a marca novamente.</p>;
    }
    
    if (!selectedBrand.suite_categories || selectedBrand.suite_categories.length === 0 || !selectedBrand.stay_durations || selectedBrand.stay_durations.length === 0) {
        return <p className="mt-4 text-slate-500">Para definir os preços, primeiro adicione 'Categorias de Suíte' e 'Tipos de Permanência' na aba de 'Marcas'.</p>;
    }


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 mt-6">
            {Object.entries(pricingData).map(([dayRange, categories]) => (
                <div key={dayRange} className="space-y-6">
                    <h3 className="text-lg font-bold text-sky-700 border-b pb-2">{dayRange}</h3>
                    {Object.entries(categories).map(([category, durations]) => (
                        <div key={category} className="p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold text-slate-700 mb-4">{category}</h4>
                            <div className="space-y-3">
                                {Object.entries(durations).map(([duration, price]) => (
                                    <div key={duration} className="grid grid-cols-3 gap-4 items-center">
                                        <label htmlFor={`${dayRange}-${category}-${duration}`} className="text-sm text-slate-600 col-span-2">{duration}</label>
                                        <FormField id={`${dayRange}-${category}-${duration}`} name="price" type="number" value={String(price)} onChange={(e) => handlePriceChange(dayRange, category, duration, e.target.value)} label="" inputPrefix="R$" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
  };

  // --- Extras Handlers ---
  const handleExtraFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExtra.title || currentExtra.price === undefined) {
      setError('Título e preço são obrigatórios.');
      return;
    }
    try {
        const payload: any = { ...currentExtra };
        if (editingExtra) {
            extraService.updateExtra({ ...editingExtra, ...payload });
            showSaveStatus('Item extra atualizado!', 'success');
        } else {
            extraService.addExtra(payload);
            showSaveStatus('Item extra adicionado!', 'success');
        }
        setExtraFormVisible(false);
        setEditingExtra(null);
        setExtras(extraService.getExtras().sort((a, b) => a.order - b.order));
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar extra.');
    }
  };

  const handleEditExtra = (extra: ExtraItem) => {
      setEditingExtra(extra);
      setCurrentExtra({ ...extra });
      setExtraFormVisible(true);
      setError('');
  };

  const handleDeleteExtra = (id: string) => {
      if (window.confirm('Tem certeza que deseja excluir este item?')) {
          extraService.deleteExtra(id);
          setExtras(extraService.getExtras().sort((a, b) => a.order - b.order));
          showSaveStatus('Item removido.', 'success');
      }
  };

  const handleToggleExtraStatus = (id: string) => {
      extraService.toggleStatus(id);
      setExtras(extraService.getExtras().sort((a, b) => a.order - b.order));
  };


  // --- Login/Logout ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <p className="text-white">Verificando sessão...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-800 py-8 px-4 flex flex-col items-center justify-center">
        <div className="bg-white p-8 md:p-10 rounded-xl shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-sky-700 mb-6">Login Administrativo</h1>
          <form onSubmit={handleLogin}>
            <FormField id="email" name="email" type="email" label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <FormField id="password" name="password" type="password" label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            {error && <p className="text-red-500 text-sm mt-2 mb-4">{error}</p>}
            <Button type="submit" className="w-full mt-4" isLoading={isSaving}>Entrar</Button>
          </form>
          <Button onClick={onNavigateToReservation} variant="secondary" className="w-full mt-4">Voltar para Reservas</Button>
        </div>
      </div>
    );
  }
  
  const brandOptions = brands.map(b => ({ value: String(b.id), label: b.name }));

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-10 gap-6 border-b border-[#1B3B5F]/10 pb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1E90FF]/10 rounded-2xl">
              <LayoutDashboard className="w-8 h-8 text-[#1E90FF]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#1B3B5F] tracking-tight">Painel Administrativo</h1>
              <p className="text-[#9CA3AF] text-sm font-medium">Gerencie marcas, unidades e reservas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleLogout} variant="secondary" size="sm" className="flex items-center gap-2 text-red-500 hover:bg-red-50 rounded-xl px-4">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
            <Button onClick={onNavigateToReservation} variant="secondary" size="sm" className="flex items-center gap-2 rounded-xl px-4">
              <ChevronLeft className="w-4 h-4" />
              Voltar ao Site
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
            <TabButton tabId="brands" activeTab={activeTab} onClick={setActiveTab} icon={<Building2 className="w-4 h-4" />}>Marcas</TabButton>
            <TabButton tabId="units" activeTab={activeTab} onClick={setActiveTab} icon={<Hotel className="w-4 h-4" />}>Unidades</TabButton>
            <TabButton tabId="suites" activeTab={activeTab} onClick={setActiveTab} icon={<BedDouble className="w-4 h-4" />}>Suítes</TabButton>
            <TabButton tabId="prices" activeTab={activeTab} onClick={setActiveTab} icon={<DollarSign className="w-4 h-4" />}>Preços</TabButton>
            <TabButton tabId="extras" activeTab={activeTab} onClick={setActiveTab} icon={<Sparkles className="w-4 h-4" />}>Extras & Pacotes</TabButton>
            <TabButton tabId="settings" activeTab={activeTab} onClick={setActiveTab} icon={<Settings className="w-4 h-4" />}>Configurações</TabButton>
        </div>
        
        {error && <div className="p-3 mb-4 rounded-md text-sm bg-red-100 text-red-800">{error}</div>}
        {saveStatus && <div className={`p-3 mb-4 rounded-md text-sm ${saveStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{saveStatus.message}</div>}

        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
            <p className="text-[#9CA3AF] font-medium animate-pulse">Carregando dados do sistema...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Brands Tab */}
              <div className={activeTab === 'brands' ? 'block' : 'hidden'}>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Gerenciar Marcas</h2>
                {!brandFormVisible && <Button onClick={() => { setCurrentBrand({ name: '', suite_categories: [], stay_durations: []}); setEditingBrand(null); setBrandFormVisible(true); }} className="mb-6">Adicionar Nova Marca</Button>}
                {brandFormVisible && (
                  <form onSubmit={handleBrandFormSubmit} className="bg-slate-50 p-4 rounded-lg mb-6 border">
                    <h3 className="text-lg font-semibold mb-4">{editingBrand ? 'Editar Marca' : 'Nova Marca'}</h3>
                    <FormField label="Nome da Marca" id="brandName" name="name" value={currentBrand.name || ''} onChange={(e) => setCurrentBrand(p => ({...p, name: e.target.value}))} required />
                    <FormField label="Categorias de Suíte (separadas por vírgula)" id="brandCategories" name="suite_categories" value={currentBrand.suite_categories?.join(', ') || ''} onChange={(e) => setCurrentBrand(p => ({...p, suite_categories: e.target.value.split(',').map(s => s.trim())}))} />
                    <FormField label="Tipos de Permanência (separadas por vírgula)" id="brandDurations" name="stay_durations" value={currentBrand.stay_durations?.join(', ') || ''} onChange={(e) => setCurrentBrand(p => ({...p, stay_durations: e.target.value.split(',').map(s => s.trim())}))} />
                    
                    <div className="flex gap-4 mt-6">
                      <Button type="submit" isLoading={isSaving}>{editingBrand ? 'Salvar' : 'Adicionar'}</Button>
                      <Button type="button" variant="secondary" onClick={() => setBrandFormVisible(false)}>Cancelar</Button>
                    </div>
                  </form>
                )}
                <DataTable 
                  headers={['Nome', 'Categorias', 'Permanências', 'Ações']} 
                  data={brands.map(b => ({
                    id: b.id,
                    cells: [
                      b.name, 
                      b.suite_categories.join(', '), 
                      b.stay_durations.join(', '), 
                      <ActionButtons onEdit={() => handleEditBrand(b)} onDelete={() => handleDeleteBrand(b.id)} />
                    ]
                  }))} 
                />
              </div>
            </div>

            {/* Units Tab */}
            <div className={activeTab === 'units' ? 'block' : 'hidden'}>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Gerenciar Unidades</h2>
                    {!unitFormVisible && <Button onClick={() => { setCurrentUnit({name: '', brandId: undefined, visible_suite_categories: [], suite_category_images: []}); setEditingUnit(null); setUnitFormVisible(true); }} className="mb-6" disabled={brands.length === 0}>Adicionar Nova Unidade</Button>}
                    {brands.length === 0 && <p className="text-sm text-slate-500">Crie uma marca antes de adicionar unidades.</p>}
                    {unitFormVisible && (
                         <form onSubmit={handleUnitFormSubmit} className="bg-slate-50 p-4 rounded-lg mb-6 border">
                             <h3 className="text-lg font-semibold mb-4">{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</h3>
                             <SelectField label="Marca" id="unitBrand" name="brandId" value={String(currentUnit.brandId || '')} onChange={(e) => setCurrentUnit(p => ({...p, brandId: parseInt(e.target.value, 10), visible_suite_categories: [] }))} options={brandOptions} required />
                             <FormField label="Nome da Unidade" id="unitName" name="name" value={currentUnit.name || ''} onChange={(e) => setCurrentUnit(p => ({...p, name: e.target.value}))} required />
                             
                             {currentUnit.brandId && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <h4 className="block text-sm font-medium text-slate-700 mb-2">Categorias e Imagens</h4>
                                    <p className="mb-4 text-xs text-slate-500">Selecione as categorias visíveis e cole as URLs públicas das imagens (do Backblaze B2).</p>
                                    <div className="space-y-4">
                                        {(brands.find(b => b.id === currentUnit.brandId)?.suite_categories || []).map(category => {
                                          const imageInfo = currentUnit.suite_category_images?.find(ci => ci.category === category);
                                          return (
                                            <div key={category} className="p-3 bg-white rounded-md border">
                                                <div className="flex items-center mb-3">
                                                    <input type="checkbox" id={`cat-${category}`} checked={currentUnit.visible_suite_categories?.includes(category) ?? false} onChange={e => handleCategoryVisibilityChange(category, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                                                    <label htmlFor={`cat-${category}`} className="ml-3 block text-sm font-semibold text-gray-800">{category}</label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                                                  <FormField label="URL da Imagem 1" id={`img1-${category}`} name={`img1-${category}`} value={imageInfo?.imageUrls?.[0] || ''} onChange={(e) => handleCategoryImageURLChange(category, e.target.value, 0)} placeholder="https://.../imagem1.jpg" />
                                                  <FormField label="URL da Imagem 2" id={`img2-${category}`} name={`img2-${category}`} value={imageInfo?.imageUrls?.[1] || ''} onChange={(e) => handleCategoryImageURLChange(category, e.target.value, 1)} placeholder="https://.../imagem2.jpg" />
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                </div>
                             )}

                             <div className="flex gap-4 mt-6">
                                <Button type="submit" isLoading={isSaving}>{editingUnit ? 'Salvar' : 'Adicionar'}</Button>
                                <Button type="button" variant="secondary" onClick={() => setUnitFormVisible(false)}>Cancelar</Button>
                             </div>
                         </form>
                    )}
                    <DataTable 
                      headers={['Nome da Unidade', 'Marca', 'Categorias Visíveis', 'Ações']} 
                      data={units.map(u => ({
                        id: u.id,
                        cells: [
                          u.name, 
                          brands.find(b=>b.id === u.brandId)?.name || 'N/A', 
                          (u.visible_suite_categories || []).join(', '), 
                          <ActionButtons onEdit={() => handleEditUnit(u)} onDelete={() => handleDeleteUnit(u.id)} />
                        ]
                      }))} 
                    />
                </div>
            </div>
            
            {/* Suites Tab */}
            <div className={activeTab === 'suites' ? 'block' : 'hidden'}>
                 <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Gerenciar Suítes</h2>
                    {!suiteFormVisible && <Button onClick={() => { setCurrentSuite({api_id: undefined, name: '', category: '', unitIds: []}); setEditingSuite(null); setSuiteFormVisible(true); }} className="mb-6">Adicionar Nova Suíte</Button>}
                    {suiteFormVisible && (
                        <form onSubmit={handleSuiteFormSubmit} className="bg-slate-50 p-4 rounded-lg mb-6 border">
                            <h3 className="text-lg font-semibold mb-4">{editingSuite ? 'Editar Suíte' : 'Nova Suíte'}</h3>
                            <FormField label="ID da API" type="number" id="suiteApiId" name="api_id" value={String(currentSuite.api_id || '')} onChange={(e) => setCurrentSuite(p => ({...p, api_id: parseInt(e.target.value, 10)}))} required />
                            <FormField label="Nome" id="suiteName" name="name" value={currentSuite.name || ''} onChange={(e) => setCurrentSuite(p => ({...p, name: e.target.value}))} required />
                            <FormField label="Categoria" id="suiteCategory" name="category" value={currentSuite.category || ''} onChange={(e) => setCurrentSuite(p => ({...p, category: e.target.value}))} required instruction="A categoria deve corresponder a uma das categorias cadastradas na marca." />

                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Disponível nas Unidades</label>
                                <div className="space-y-2">
                                    {units.length > 0 ? units.map(unit => (
                                        <div key={unit.id} className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                id={`suite-unit-${unit.id}`} 
                                                checked={currentSuite.unitIds?.includes(unit.id) ?? false} 
                                                onChange={e => handleSuiteUnitAssignmentChange(unit.id, e.target.checked)} 
                                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                                            <label htmlFor={`suite-unit-${unit.id}`} className="ml-3 block text-sm text-gray-700">{unit.name} ({brands.find(b => b.id === unit.brandId)?.name})</label>
                                        </div>
                                    )) : <p className="text-xs text-slate-500">Nenhuma unidade cadastrada. Crie unidades na aba 'Unidades'.</p>}
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">Marque as unidades onde esta suíte estará disponível.</p>
                            </div>

                             <div className="flex gap-4 mt-6">
                                <Button type="submit" isLoading={isSaving}>{editingSuite ? 'Salvar' : 'Adicionar'}</Button>
                                <Button type="button" variant="secondary" onClick={() => setSuiteFormVisible(false)}>Cancelar</Button>
                             </div>
                        </form>
                    )}
                    <DataTable 
                        headers={['ID da API', 'Nome', 'Categoria', 'Unidades', 'Ações']} 
                        data={suites.map(s => ({
                            id: s.id,
                            cells: [
                              s.api_id, 
                              s.name, 
                              s.category, 
                              s.unitIds?.map(unitId => units.find(u => u.id === unitId)?.name).filter(Boolean).join(', ') || 'Nenhuma',
                              <ActionButtons onEdit={() => handleEditSuite(s)} onDelete={() => handleDeleteSuite(s.id)} />
                            ]
                        }))} 
                    />
                 </div>
            </div>

            {/* Pricing Tab */}
            <div className={activeTab === 'prices' ? 'block' : 'hidden'}>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-slate-800">Tabela de Preços</h2>
                        <Button onClick={handleSavePrices} isLoading={isSaving} disabled={!pricingData}>Salvar Preços</Button>
                    </div>
                     <SelectField label="Selecione a Marca para editar os preços" id="pricingBrand" name="brandId" value={selectedBrandForPricing} onChange={(e) => setSelectedBrandForPricing(e.target.value)} options={brandOptions} />
                     {renderPricingContent()}
                </div>
            </div>

            {/* Extras Tab */}
            <div className={activeTab === 'extras' ? 'block' : 'hidden'}>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Catálogo de Extras & Pacotes</h2>
                    {!extraFormVisible && <Button onClick={() => { setCurrentExtra({title: '', price: 0, description: '', image: '', category: '', tag: '', active: true, order: 0}); setEditingExtra(null); setExtraFormVisible(true); }} className="mb-6">Adicionar Novo Extra</Button>}
                    
                    {extraFormVisible && (
                        <form onSubmit={handleExtraFormSubmit} className="bg-slate-50 p-4 rounded-lg mb-6 border space-y-4">
                            <h3 className="text-lg font-semibold mb-4">{editingExtra ? 'Editar Extra' : 'Novo Extra'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Título" id="extraTitle" name="title" value={currentExtra.title || ''} onChange={(e) => setCurrentExtra(p => ({...p, title: e.target.value}))} required />
                                <FormField label="Preço (R$)" id="extraPrice" name="price" type="number" value={String(currentExtra.price)} onChange={(e) => setCurrentExtra(p => ({...p, price: parseFloat(e.target.value)}))} required />
                            </div>
                            <FormField label="Descrição" id="extraDescription" name="description" value={currentExtra.description || ''} onChange={(e) => setCurrentExtra(p => ({...p, description: e.target.value}))} fieldType="textarea" rows={2} />
                            <FormField label="URL da Imagem" id="extraImage" name="image" value={currentExtra.image || ''} onChange={(e) => setCurrentExtra(p => ({...p, image: e.target.value}))} placeholder="https://..." />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField label="Categoria (Ex: Bebidas, Romântico)" id="extraCategory" name="category" value={currentExtra.category || ''} onChange={(e) => setCurrentExtra(p => ({...p, category: e.target.value}))} />
                                <FormField label="Tag (Ex: Mais pedido)" id="extraTag" name="tag" value={currentExtra.tag || ''} onChange={(e) => setCurrentExtra(p => ({...p, tag: e.target.value}))} />
                                <FormField label="Ordem de Exibição" id="extraOrder" name="order" type="number" value={String(currentExtra.order || 0)} onChange={(e) => setCurrentExtra(p => ({...p, order: parseInt(e.target.value)}))} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    id="extraActive" 
                                    checked={currentExtra.active ?? true} 
                                    onChange={(e) => setCurrentExtra(p => ({...p, active: e.target.checked}))}
                                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" 
                                />
                                <label htmlFor="extraActive" className="text-sm font-medium text-gray-700">Item Ativo no Formulário</label>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <Button type="submit">{editingExtra ? 'Salvar' : 'Adicionar'}</Button>
                                <Button type="button" variant="secondary" onClick={() => setExtraFormVisible(false)}>Cancelar</Button>
                            </div>
                        </form>
                    )}

                    <DataTable 
                        headers={['Imagem', 'Título', 'Categoria', 'Preço', 'Ordem', 'Status', 'Ações']}
                        data={extras.map(e => ({
                            id: e.id,
                            cells: [
                                e.image ? <img src={e.image} alt={e.title} className="w-12 h-12 object-cover rounded-md" /> : 'Sem img',
                                e.title,
                                e.category || '-',
                                `R$ ${e.price.toFixed(2)}`,
                                e.order || 0,
                                <span className={`px-2 py-1 rounded text-xs ${e.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{e.active ? 'Ativo' : 'Inativo'}</span>,
                                <div className="space-x-2">
                                    <Button onClick={() => handleToggleExtraStatus(e.id)} variant="secondary" className="!py-1 !px-2 text-xs">{e.active ? 'Desativar' : 'Ativar'}</Button>
                                    <Button onClick={() => handleEditExtra(e)} variant="secondary" className="text-sky-600 hover:text-sky-900 !py-1 !px-2 text-xs">Editar</Button>
                                    <Button onClick={() => handleDeleteExtra(e.id)} variant="secondary" className="text-red-600 hover:text-red-900 !py-1 !px-2 text-xs">Excluir</Button>
                                </div>
                            ]
                        }))}
                    />
                </div>
            </div>

            {/* Settings Tab */}
            <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4">Configurações Gerais</h2>
                    <p className="text-sm text-slate-500 mb-6 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                      Nota: Essas alterações são salvas localmente neste navegador. Para uma aplicação em produção, estes dados deveriam ser salvos no banco de dados.
                    </p>
                    <form onSubmit={handleSettingsSubmit} className="space-y-4">
                        <FormField 
                            label="Título Principal" 
                            id="appTitle" 
                            name="title" 
                            value={localSettings.title} 
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, title: e.target.value }))} 
                            placeholder="Ex: Reserva Premium"
                            required
                        />
                        <FormField 
                            label="Subtítulo / Nome do Hotel" 
                            id="appSubtitle" 
                            name="subtitle" 
                            value={localSettings.subtitle} 
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, subtitle: e.target.value }))} 
                            placeholder="Ex: Hotel 1001 Noites Prime"
                            required
                        />
                        <Button type="submit">Salvar Alterações</Button>
                    </form>
                </div>
            </div>
          </motion.div>
        </AnimatePresence>
        )}
      </div>
    </div>
  );
};


const TabButton: React.FC<{
  tabId: AdminTab;
  activeTab: AdminTab;
  children: React.ReactNode;
  onClick: (tabId: AdminTab) => void;
  icon?: React.ReactNode;
}> = ({ tabId, activeTab, children, onClick, icon }) => (
  <button
    onClick={() => onClick(tabId)}
    className={cn(
      'px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2',
      activeTab === tabId
        ? 'bg-[#1E90FF] text-white shadow-lg shadow-[#1E90FF]/30 translate-y-[-1px]'
        : 'bg-white text-[#1B3B5F] hover:bg-[#F8FAFC] border border-[#1B3B5F]/10'
    )}
  >
    {icon}
    {children}
  </button>
);

interface DataRow {
  id: string | number;
  cells: (string | number | React.ReactNode)[];
}

const DataTable: React.FC<{ headers: string[]; data: DataRow[]}> = ({ headers, data }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>{headers.map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {data.length === 0 ? <tr><td colSpan={headers.length} className="px-6 py-4 text-center text-slate-500">Nenhum dado encontrado.</td></tr> :
                data.map(row => <tr key={row.id}>{row.cells.map((cell, j) => <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{cell}</td>)}</tr>)}
            </tbody>
        </table>
    </div>
);

const ActionButtons: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => (
    <div className="flex items-center gap-2">
        <Button onClick={onEdit} variant="secondary" size="sm" className="h-8 w-8 p-0 text-[#1E90FF] hover:bg-[#1E90FF]/10">
            <Edit2 className="w-4 h-4" />
        </Button>
        <Button onClick={onDelete} variant="secondary" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
        </Button>
    </div>
);


export default AdminPage;
