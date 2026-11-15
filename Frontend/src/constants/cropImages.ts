import cassavaImg from '../assets/cassavaImage.jpg';
import cowpeaImg from '../assets/cowpeaImage.jpg';
import groundnutImg from '../assets/groundnutImage.jpg';
import milletImg from '../assets/illetImage.webp';
import maizeImg from '../assets/maizeImage.png';
import plantainImg from '../assets/plantainImage.webp';
import riceImg from '../assets/riceImage.jpg';
import sorghumImg from '../assets/sorghumImage.jpg';
import sweetPotatoImg from '../assets/sweetPotatoImage.png';
import yamImg from '../assets/yamImage.webp';

export const CROP_IMAGES: Record<string, string> = {
  cassava: cassavaImg,
  cowpea: cowpeaImg,
  groundnut: groundnutImg,
  peanut: groundnutImg,
  millet: milletImg,
  'pearl millet': milletImg,
  illet: milletImg,
  maize: maizeImg,
  corn: maizeImg,
  plantain: plantainImg,
  banana: plantainImg,
  rice: riceImg,
  sorghum: sorghumImg,
  'grain sorghum': sorghumImg,
  'sweet potato': sweetPotatoImg,
  sweetpotato: sweetPotatoImg,
  yam: yamImg,
};

export function getCropImage(cropName: string): string | null {
  if (!cropName) return null;
  const normalized = cropName.toLowerCase().trim();

  // Direct match
  if (CROP_IMAGES[normalized]) {
    return CROP_IMAGES[normalized];
  }

  // Substring match
  for (const [key, image] of Object.entries(CROP_IMAGES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return image;
    }
  }

  return null;
}
