import { useStore } from '../store/useStore';
import { translations } from '../utils/translations';

export const useTranslation = () => {
  const lang = useStore((state) => state.lang);

  const t = translations[lang];
  
  return { t, lang };
};
