import { useStore } from '../store/useStore';
import { translations } from '../utils/translations';

export const useTranslation = () => {
  const lang = useStore((state) => state.lang) || "en";
  const t = translations[lang] || translations["en"];
  
  return { t, lang };
};
