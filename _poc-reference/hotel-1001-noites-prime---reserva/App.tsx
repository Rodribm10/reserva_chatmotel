
import * as React from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Copy, Check, ArrowLeft, Settings, Loader2, Calendar, User, Phone, Mail, FileText, Info, Building2, Hotel, Clock, BedDouble } from 'lucide-react';
import FormField from './components/FormField.tsx';
import SelectField from './components/SelectField.tsx';
import { Button } from './components/ui/button.tsx';
import AdminPage from './components/AdminPage.tsx';
import { FormDataModel, ApiPostPayload, SubmissionState, N8nApiResponse, Brand, HotelUnit, ExtraItem } from './types.ts';
import { submitReservation, checkPaymentStatus } from './services/apiService.ts';
import { suiteService } from './services/suiteService.ts';
import { hotelUnitService } from './services/hotelUnitService.ts';
import { brandService } from './services/brandService.ts';
import { pricingService } from './services/pricingService.ts';
import { extraService } from './services/extraService.ts';

const MODO_FIXED = 0;

type SelectOption = { value: string; label: string };

const App: React.FC = () => {
  const [currentView, setCurrentView] = React.useState<'reservation' | 'admin'>('reservation');
  const [view, setView] = React.useState<'form' | 'payment' | 'success' | 'expired'>('form');
  const [isDataLoading, setIsDataLoading] = React.useState(true);

  // Configuração de Título e Subtítulo (Persistência Local)
  const [appConfig, setAppConfig] = React.useState({
    title: 'Reserva Premium',
    subtitle: 'Hotel 1001 Noites Prime'
  });

  React.useEffect(() => {
    const savedConfig = localStorage.getItem('hotelAppConfig');
    if (savedConfig) {
      try {
        setAppConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Erro ao carregar configurações", e);
      }
    }
  }, []);

  const handleSaveConfig = (newConfig: { title: string; subtitle: string }) => {
    setAppConfig(newConfig);
    localStorage.setItem('hotelAppConfig', JSON.stringify(newConfig));
  };

  const initialFormData: FormDataModel = {
    nome: '',
    checkInDateTime: '',
    telefone: '',
    email: '',
    cpf: '',
    observacao: '',
    selectedBrand: '',
    selectedUnit: '',
    selectedCategory: '',
    stayDuration: '',
    selectedExtras: [],
  };

  const [formData, setFormData] = React.useState<FormDataModel>(initialFormData);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [submissionStatus, setSubmissionStatus] = React.useState<SubmissionState | null>(null);
  const [formErrors, setFormErrors] = React.useState<Partial<Record<keyof FormDataModel, string>>>({});
  
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [units, setUnits] = React.useState<HotelUnit[]>([]);
  
  const [brandOptions, setBrandOptions] = React.useState<SelectOption[]>([]);
  const [unitOptions, setUnitOptions] = React.useState<SelectOption[]>([]);
  const [categoryOptions, setCategoryOptions] = React.useState<SelectOption[]>([]);
  const [durationOptions, setDurationOptions] = React.useState<SelectOption[]>([]);
  
  const [isCopied, setIsCopied] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(10 * 60);
  const [selectedCategoryImageUrls, setSelectedCategoryImageUrls] = React.useState<string[] | null>(null);
  
  const [calculatedPrice, setCalculatedPrice] = React.useState<number | null>(null);
  const [basePrice, setBasePrice] = React.useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = React.useState<boolean>(false);

  // Extras state
  const [availableExtras, setAvailableExtras] = React.useState<ExtraItem[]>([]);


  const txid = submissionStatus?.pix?.txid; // Extract txid for cleaner dependency management

  React.useEffect(() => {
    if (view !== 'payment' || !txid) return;

    const pollInterval = setInterval(async () => {
      try {
        const result = await checkPaymentStatus(txid);
        if (result?.status?.trim().toLowerCase() === 'pago') {
          clearInterval(pollInterval);
          setView('success');
          triggerFireworks();
        }
      } catch (err) {
        console.error("Erro ao verificar pagamento:", err);
      }
    }, 10000); // A cada 10 segundos

    return () => clearInterval(pollInterval);
  }, [txid, view]);

  React.useEffect(() => {
    if (view !== 'payment') return;

    setTimeLeft(10 * 60);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setView('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // A cada 1 segundo

    return () => clearInterval(timer);
  }, [view]);

  const triggerFireworks = () => {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = window.setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };


  const loadInitialData = React.useCallback(async () => {
    setIsDataLoading(true);
    try {
      const allBrands = await brandService.getAllBrands();
      const allUnits = await hotelUnitService.getAllUnits();
      setBrands(allBrands);
      setUnits(allUnits);
      setBrandOptions(allBrands.map(b => ({ value: String(b.id), label: b.name })));
      
      const extras = extraService.getExtras();
      setAvailableExtras(extras.filter(e => e.active).sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (currentView === 'reservation') {
      loadInitialData();
    }
  }, [currentView, loadInitialData]);

  // Atualiza Unidades e Tipos de Permanência quando a Marca muda
  React.useEffect(() => {
    if (formData.selectedBrand) {
      const brandId = parseInt(formData.selectedBrand, 10);
      const selectedBrand = brands.find(b => b.id === brandId);
      
      if (selectedBrand) {
        setUnitOptions(units.filter(u => u.brandId === brandId).map(u => ({ value: String(u.id), label: u.name })));
        setDurationOptions(selectedBrand.stay_durations.map(d => ({ value: d, label: d })));
      }
    } else {
      setUnitOptions([]);
      setCategoryOptions([]);
      setDurationOptions([]);
    }
  }, [formData.selectedBrand, brands, units]);
  
  // Atualiza Categorias de Suíte quando a Unidade muda
  React.useEffect(() => {
      if (formData.selectedUnit) {
          const unitId = parseInt(formData.selectedUnit, 10);
          const selectedUnit = units.find(u => u.id === unitId);

          if (selectedUnit?.visible_suite_categories) {
              setCategoryOptions(selectedUnit.visible_suite_categories.map(c => ({ value: c, label: c })));
          } else {
              setCategoryOptions([]); // Limpa se a unidade não tem categorias visíveis configuradas
          }
      } else {
          setCategoryOptions([]); // Limpa se nenhuma unidade está selecionada
      }
  }, [formData.selectedUnit, units]);
  
    // Atualiza a imagem da categoria quando a categoria ou unidade muda
  React.useEffect(() => {
    if (formData.selectedUnit && formData.selectedCategory) {
      const unit = units.find(u => String(u.id) === formData.selectedUnit);
      const imageInfo = unit?.suite_category_images?.find(img => img.category === formData.selectedCategory);
      setSelectedCategoryImageUrls(imageInfo?.imageUrls || null);
    } else {
      setSelectedCategoryImageUrls(null);
    }
  }, [formData.selectedCategory, formData.selectedUnit, units]);

  // Efeito para calcular o preço dinamicamente
  React.useEffect(() => {
    const calculatePrice = async () => {
        if (formData.selectedBrand && formData.selectedCategory && formData.stayDuration && formData.checkInDateTime) {
            setIsPriceLoading(true);
            setBasePrice(null);
            setCalculatedPrice(null);
            try {
                const pricingData = await pricingService.getPricingData(parseInt(formData.selectedBrand, 10));
                const dayOfWeek = new Date(formData.checkInDateTime).getDay();
                const dayRange = (dayOfWeek >= 1 && dayOfWeek <= 3) ? "SEGUNDA A QUARTA" : "QUINTA A DOMINGO";
                const price = pricingData?.[dayRange]?.[formData.selectedCategory]?.[formData.stayDuration];
                
                if (price !== undefined && price > 0) {
                    setBasePrice(price);
                } else {
                    setBasePrice(null);
                }
            } catch (error) {
                console.error("Error calculating price:", error);
                setBasePrice(null);
            } finally {
                setIsPriceLoading(false);
            }
        } else {
            setBasePrice(null);
        }
    };

    const debounceTimer = setTimeout(() => {
        calculatePrice();
    }, 300); // Debounce to avoid rapid recalculations

    return () => clearTimeout(debounceTimer);
  }, [formData.selectedBrand, formData.selectedCategory, formData.stayDuration, formData.checkInDateTime]);
  
  // Recalculate total price when Extras change or Base price changes
  React.useEffect(() => {
      if (basePrice !== null) {
          const extrasTotal = formData.selectedExtras.reduce((sum, extraId) => {
              const extra = availableExtras.find(e => e.id === extraId);
              return sum + (extra ? extra.price : 0);
          }, 0);
          setCalculatedPrice(basePrice + extrasTotal);
      } else {
          setCalculatedPrice(null);
      }
  }, [basePrice, formData.selectedExtras, availableExtras]);


  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormDataModel, string>> = {};
    if (!formData.nome.trim()) errors.nome = "Nome completo é obrigatório.";
    if (!formData.checkInDateTime) errors.checkInDateTime = "Data e horário do check-in são obrigatórios.";
    else if (new Date(formData.checkInDateTime) <= new Date()) {
        errors.checkInDateTime = "A data de check-in deve ser futura.";
    }
    
    const cleanedTelefone = formData.telefone.replace(/\D/g, '');
    if (!cleanedTelefone || !/^\d{10,11}$/.test(cleanedTelefone)) { 
        errors.telefone = "Telefone inválido (DDD + 8 ou 9 dígitos).";
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Formato de e-mail inválido.";

    const cleanedCpf = formData.cpf.replace(/\D/g, '');
    if (!formData.cpf.trim() || !/^\d{11}$/.test(cleanedCpf)) errors.cpf = "CPF inválido (11 dígitos).";

    if (!formData.selectedBrand) errors.selectedBrand = "Seleção de marca é obrigatória.";
    if (!formData.selectedUnit) errors.selectedUnit = "Seleção de unidade é obrigatória.";
    if (!formData.selectedCategory) errors.selectedCategory = "Seleção de categoria é obrigatória.";
    if (!formData.stayDuration) errors.stayDuration = "Seleção do tipo de permanência é obrigatória.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTelefoneChange = (value: string): string => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d{1,5})(\d{4})/, '($1)$2-$3');
  };

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'selectedBrand') {
        setFormData(prev => ({ ...prev, selectedBrand: value, selectedUnit: '', selectedCategory: '', stayDuration: '' }));
    } else if (name === 'selectedUnit') {
        setFormData(prev => ({ ...prev, selectedUnit: value, selectedCategory: '' }));
    } else if (name === 'telefone') {
      setFormData(prev => ({ ...prev, telefone: handleTelefoneChange(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (formErrors[name as keyof FormDataModel]) {
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [formErrors]);

  const toggleExtra = (extra: ExtraItem) => {
    setFormData(prev => {
        const isSelected = prev.selectedExtras.includes(extra.id);
        const newExtras = isSelected
            ? prev.selectedExtras.filter(id => id !== extra.id)
            : [...prev.selectedExtras, extra.id];
        return { ...prev, selectedExtras: newExtras };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmissionStatus(null);
    if (!validateForm()) {
        setSubmissionStatus({ message: "Por favor, corrija os campos destacados.", type: 'error' });
        return;
    }

    if (calculatedPrice === null || calculatedPrice <= 0) {
      setSubmissionStatus({ message: "Não foi possível calcular o preço. Verifique se todas as opções de reserva estão preenchidas corretamente.", type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
        const price = calculatedPrice;

        const selectedUnitId = parseInt(formData.selectedUnit, 10);
        if (isNaN(selectedUnitId)) {
            throw new Error("Unidade do hotel inválida selecionada.");
        }

        const selectedSuiteApiId = await suiteService.getRandomSuiteApiIdFromCategory(formData.selectedCategory, selectedUnitId);
        if (selectedSuiteApiId === null) {
          throw new Error("Nenhuma suíte disponível para a categoria e unidade selecionadas.");
        }
    
        const cleanedCpf = formData.cpf.replace(/\D/g, '');
        const cleanedTelefone = formData.telefone.replace(/\D/g, '');
        const integracaoId = `reserva-${cleanedCpf.substring(0, 9)}-${Date.now().toString().slice(-6)}`;
        const selectedBrandName = brands.find(b => b.id === parseInt(formData.selectedBrand, 10))?.name || '';
        const selectedUnitName = units.find(u => u.id === parseInt(formData.selectedUnit, 10))?.name || '';
        
        const selectedExtrasObjects = availableExtras.filter(e => formData.selectedExtras.includes(e.id));
    
        const apiPayload: ApiPostPayload = {
          suite_id: selectedSuiteApiId,
          data_inicio: new Date(formData.checkInDateTime).toISOString(),
          nome: formData.nome,
          telefone: cleanedTelefone,
          email: formData.email,
          cpf: cleanedCpf,
          integracao_id: integracaoId,
          modo: MODO_FIXED,
          marca: selectedBrandName,
          unidade: selectedUnitName,
          categoria: formData.selectedCategory,
          permanencia: formData.stayDuration,
          valor: price / 2, // Envia apenas 50% do valor para o pagamento PIX
          observacoes: formData.observacao.trim(),
          extras_selecionados: selectedExtrasObjects
        };

        const apiResponse = await submitReservation(apiPayload);
        
        setSubmissionStatus({
            message: 'Sua reserva foi iniciada! Realize o pagamento via Pix para confirmar.',
            type: 'success',
            pix: {
                qrCodeValue: apiResponse.pixUrl,
                copyPasteCode: apiResponse.pixCopiaECola,
                txid: apiResponse.txid,
            }
        });
        setView('payment');
    } catch (error) {
      const detailedErrorMessage = error instanceof Error ? error.message : "Houve um problema desconhecido.";
      setSubmissionStatus({
        message: `Falha na solicitação: ${detailedErrorMessage}`,
        type: 'error'
      });
      console.error("API Submission Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyPix = () => {
    if (submissionStatus?.pix?.copyPasteCode) {
      navigator.clipboard.writeText(submissionStatus.pix.copyPasteCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
    setSubmissionStatus(null);
    setFormErrors({});
    setIsLoading(false);
    setView('form');
  };
  
  const handleNavigateToReservation = () => {
    setCurrentView('reservation');
  };

  if (currentView === 'admin') {
    return (
      <AdminPage 
        onNavigateToReservation={handleNavigateToReservation} 
        currentConfig={appConfig}
        onSaveConfig={handleSaveConfig}
      />
    );
  }

  const renderContent = () => {
    switch (view) {
        case 'success':
            return (
                <div className="text-center space-y-6 p-10 bg-[#F8FAFC] border border-[#1B3B5F]/10 rounded-3xl shadow-inner">
                    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-md">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-[#1B3B5F]">Pagamento Confirmado!</h2>
                    <p className="text-[#9CA3AF] text-lg">Sua reserva está 100% garantida.<br/>Enviamos os detalhes para o seu e-mail.</p>
                    <div className="pt-6">
                        <Button onClick={handleResetForm} variant="outline" className="w-full">
                            Fazer Nova Reserva
                        </Button>
                    </div>
                </div>
            );
        case 'expired':
             return (
                <div className="text-center space-y-6 p-10 bg-red-50 border border-red-100 rounded-3xl shadow-inner">
                    <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-md">
                        <AlertTriangle className="h-12 w-12 text-red-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-[#1B3B5F]">Tempo Esgotado</h2>
                    <p className="text-[#9CA3AF] text-lg">O tempo para realizar o pagamento expirou.<br/>Por favor, inicie uma nova reserva.</p>
                    <div className="pt-6">
                         <Button onClick={handleResetForm} variant="outline" className="w-full">
                            Tentar Novamente
                        </Button>
                    </div>
                </div>
            );
        case 'payment':
            return (
                <div className="text-center space-y-6">
                    <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#1B3B5F]/10 mb-6">
                         <p className="text-[#1B3B5F] font-medium">{submissionStatus?.message}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Tempo Restante</p>
                        <div className="text-4xl font-extrabold text-red-500 tabular-nums tracking-tight">
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm flex items-center justify-center gap-2 shadow-sm">
                        <Info className="w-5 h-5 text-amber-500" />
                        <span>Restam apenas <strong className="font-bold">3 suítes</strong> disponíveis — garanta a sua!</span>
                    </div>

                    <div className="pt-4 pb-2 text-left">
                        <label className="block text-xs font-bold text-[#1B3B5F] uppercase tracking-wide mb-2">Código Pix Copia e Cola</label>
                        <div className="relative group">
                            <input
                                type="text"
                                readOnly
                                value={submissionStatus?.pix?.copyPasteCode || ''}
                                className="w-full bg-[#F8FAFC] border-[1.5px] border-[#1B3B5F]/20 rounded-xl p-4 pr-28 text-sm text-[#1B3B5F] font-mono focus:outline-none focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/10 transition-all"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Button onClick={handleCopyPix} size="sm" variant={isCopied ? "default" : "secondary"} className="flex items-center gap-2">
                                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {isCopied ? 'Copiado!' : 'Copiar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-[#1B3B5F]/10">
                        <Button onClick={handleResetForm} variant="ghost" className="w-full text-[#9CA3AF] hover:text-[#1B3B5F] flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Cancelar e Voltar
                        </Button>
                    </div>
                </div>
            );
        case 'form':
        default:
            return (
                <>
                    <div className="sm:hidden flex justify-center mb-8"> 
                        <Button onClick={() => setCurrentView('admin')} variant="secondary" size="sm" className="rounded-full px-6 flex items-center gap-2"> 
                            <Settings className="w-4 h-4" />
                            Painel Admin 
                        </Button> 
                    </div>
                    
                    {isDataLoading ? (
                      <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
                          <Loader2 className="w-8 h-8 text-[#1E90FF] animate-spin" />
                          <p className="text-[#9CA3AF] font-medium animate-pulse">Carregando dados...</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} noValidate className="space-y-2">
                          <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#1B3B5F]/10 mb-8 shadow-sm">
                              <h3 className="text-[#1B3B5F] font-bold text-sm uppercase tracking-wider mb-4 border-b border-[#1B3B5F]/10 pb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Detalhes da Estadia
                              </h3>
                              <div className="grid grid-cols-1 gap-1">
                                  <SelectField id="selectedBrand" name="selectedBrand" label="Marca" value={formData.selectedBrand} onChange={handleChange} options={brandOptions} required placeholder="Selecione a marca" disabled={brandOptions.length === 0} instruction={brandOptions.length === 0 ? "Nenhuma marca disponível." : ""} error={!!formErrors.selectedBrand} icon={<Building2 className="w-4 h-4" />} />
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <SelectField id="selectedUnit" name="selectedUnit" label="Unidade do Hotel" value={formData.selectedUnit} onChange={handleChange} options={unitOptions} required placeholder="Selecione a unidade" disabled={!formData.selectedBrand || unitOptions.length === 0} instruction={!!formData.selectedBrand && unitOptions.length === 0 ? "Nenhuma unidade para esta marca." : ""} error={!!formErrors.selectedUnit} icon={<Hotel className="w-4 h-4" />} />
                                      <SelectField id="stayDuration" name="stayDuration" label="Permanência" value={formData.stayDuration} onChange={handleChange} options={durationOptions} required placeholder="Selecione o tempo" disabled={!formData.selectedBrand} error={!!formErrors.stayDuration} icon={<Clock className="w-4 h-4" />} />
                                  </div>

                                  <SelectField id="selectedCategory" name="selectedCategory" label="Categoria da Suíte" value={formData.selectedCategory} onChange={handleChange} options={categoryOptions} required placeholder="Selecione a categoria" disabled={!formData.selectedUnit || categoryOptions.length === 0} instruction={!!formData.selectedUnit && categoryOptions.length === 0 ? "Nenhuma categoria disponível para esta unidade." : ""} error={!!formErrors.selectedCategory} icon={<BedDouble className="w-4 h-4" />} />
                                  
                                  <FormField id="checkInDateTime" name="checkInDateTime" label="Data e Horário do Check-in" type="datetime-local" value={formData.checkInDateTime} onChange={handleChange} required error={!!formErrors.checkInDateTime} icon={<Calendar className="w-4 h-4" />} />
                              </div>
                          </div>
                          
                          {selectedCategoryImageUrls && selectedCategoryImageUrls.length > 0 && (
                            <div className="mb-8 animate-fade-in grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedCategoryImageUrls.map((url, index) => (
                                    url && (
                                      <a href={url} target="_blank" rel="noopener noreferrer" key={index} className="block group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300">
                                        <div className="absolute inset-0 bg-[#0A1A2F]/20 group-hover:bg-transparent transition-colors z-10" />
                                        <img 
                                            src={url} 
                                            alt={`Imagem ${index + 1}`}
                                            className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                                        />
                                      </a>
                                    )
                                ))}
                            </div>
                          )}

                          {/* Seção de Extras */}
                          {basePrice !== null && availableExtras.length > 0 && (
                              <div className="mb-8 animate-fade-in">
                                  <h3 className="text-[#1B3B5F] font-bold text-sm uppercase tracking-wider mb-2">Adicione algo especial à sua experiência</h3>
                                  <div className="grid grid-cols-1 gap-4 mt-4">
                                      {availableExtras.map(extra => {
                                          const isSelected = formData.selectedExtras.includes(extra.id);
                                          return (
                                              <div
                                                  key={extra.id}
                                                  onClick={() => toggleExtra(extra)}
                                                  className={`
                                                    cursor-pointer transition-all duration-200
                                                    p-4 rounded-2xl shadow-md
                                                    border ${isSelected ? 'border-[#1E90FF] shadow-[0_0_15px_#1E90FF55]' : 'border-[#1B3B5F]'}
                                                    bg-[#0A1A2F]/80 backdrop-blur-sm
                                                    hover:scale-[1.02] hover:border-[#1E90FF]
                                                  `}
                                              >
                                                  {extra.image && <img src={extra.image} className="rounded-xl w-full h-40 object-cover mb-3" alt={extra.title} />}

                                                  <div className="flex justify-between items-start">
                                                      <h3 className="text-white font-semibold text-lg">{extra.title}</h3>

                                                      {extra.tag && (
                                                          <span className="px-3 py-1 text-xs rounded-full bg-[#1E90FF] text-white">
                                                              {extra.tag}
                                                          </span>
                                                      )}
                                                  </div>

                                                  <p className="text-gray-300 text-sm mt-1">{extra.description}</p>

                                                  <div className="mt-3 text-[#1E90FF] font-bold text-xl">
                                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(extra.price)}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}

                          <div className="my-8">
                            {isPriceLoading && (
                                <div className="text-center p-6 bg-[#F8FAFC] rounded-2xl border border-[#1B3B5F]/10">
                                    <div className="w-6 h-6 border-2 border-[#1E90FF] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-sm text-[#9CA3AF]">Calculando valor...</p>
                                </div>
                            )}
                            {!isPriceLoading && calculatedPrice !== null && (
                                <div className="relative overflow-hidden p-6 bg-[#F8FAFC] border-[1.5px] border-[#1E90FF]/20 rounded-2xl animate-fade-in shadow-lg shadow-[#1E90FF]/5">
                                    <div className="absolute top-0 right-0 bg-[#1E90FF] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">PREÇO ESTIMADO</div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm text-[#1B3B5F]">
                                            <span className="font-medium">Valor Total da Reserva</span>
                                            <span className="font-bold text-lg">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedPrice)}</span>
                                        </div>
                                        {formData.selectedExtras.length > 0 && (
                                            <div className="flex justify-between items-center text-xs text-[#9CA3AF]">
                                                <span>(Suíte + Extras)</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm text-[#9CA3AF]">
                                            <span>Pagar no check-in</span>
                                            <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedPrice / 2)}</span>
                                        </div>
                                        <div className="pt-4 border-t border-[#1B3B5F]/10 flex justify-between items-end">
                                            <div>
                                                <p className="text-xs font-bold text-[#1E90FF] uppercase tracking-wider mb-1">Entrada via Pix (50%)</p>
                                                <p className="text-[#9CA3AF] text-xs">Necessário para confirmar</p>
                                            </div>
                                            <span className="text-3xl font-extrabold text-[#1B3B5F] tracking-tight">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedPrice / 2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                          </div>
                          
                          <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#1B3B5F]/10 mb-8 shadow-sm">
                              <h3 className="text-[#1B3B5F] font-bold text-sm uppercase tracking-wider mb-4 border-b border-[#1B3B5F]/10 pb-2 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Seus Dados
                              </h3>
                              <div className="space-y-1">
                                  <FormField id="nome" name="nome" label="Nome Completo" value={formData.nome} onChange={handleChange} required placeholder="Como no documento" autoComplete="name" error={!!formErrors.nome} icon={<User className="w-4 h-4" />} />
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <FormField id="telefone" name="telefone" label="Telefone / WhatsApp" type="tel" value={formData.telefone} onChange={handleChange} required placeholder="(99) 99999-9999" autoComplete="tel" error={!!formErrors.telefone} icon={<Phone className="w-4 h-4" />} />
                                      <FormField id="cpf" name="cpf" label="CPF" type="text" value={formData.cpf} onChange={handleChange} required placeholder="Apenas números" autoComplete="off" error={!!formErrors.cpf} icon={<FileText className="w-4 h-4" />} />
                                  </div>

                                  <FormField id="email" name="email" label="E-mail" type="email" value={formData.email} onChange={handleChange} required placeholder="seu@email.com" autoComplete="email" error={!!formErrors.email} icon={<Mail className="w-4 h-4" />} />
                                  
                                  <FormField id="observacao" name="observacao" label="Observação (Opcional)" fieldType="textarea" value={formData.observacao} onChange={handleChange} placeholder="Alguma preferência especial?" rows={2} />
                              </div>
                          </div>

                          {submissionStatus?.type === 'error' && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 mb-6 rounded-xl text-sm flex items-center bg-red-50 text-red-700 border border-red-100" role="alert"
                              >
                                <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                                {submissionStatus.message}
                              </motion.div>
                          )}

                          <Button type="submit" isLoading={isLoading} disabled={isLoading || isDataLoading} size="lg" className="w-full text-lg shadow-xl shadow-[#1E90FF]/30 hover:shadow-[#1E90FF]/50 transition-all duration-300">
                              {isLoading ? 'Processando...' : 'Confirmar e Pagar Reserva'}
                          </Button>
                      </form>
                    )}
                </>
            );
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 relative">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1B3B5F] to-[#1E90FF]"></div>
        
        <div className="p-8 sm:p-12">
            <div className="flex justify-between items-start mb-10 border-b border-[#1B3B5F]/10 pb-6">
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B3B5F] tracking-tight">
                    {view === 'payment' ? 'Pagamento Seguro' : 
                    view === 'success' ? 'Reserva Confirmada' :
                    view === 'expired' ? 'Tempo Esgotado' :
                    appConfig.title}
                </h1>
                {view === 'form' && <p className="text-[#9CA3AF] text-sm font-medium">{appConfig.subtitle}</p>}
            </div>
            <Button onClick={() => setCurrentView('admin')} variant="outline" size="sm" className="hidden sm:flex rounded-full px-5 text-xs font-bold uppercase tracking-wider hover:bg-[#F8FAFC] flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Admin
            </Button>
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
      
      <footer className="text-center text-xs font-medium text-[#1E90FF]/60 mt-8">
        &copy; {new Date().getFullYear()} {appConfig.title} &bull; Experiência Exclusiva
      </footer>
    </div>
  );
};

export default App;
