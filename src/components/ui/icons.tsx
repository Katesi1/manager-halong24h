/**
 * Icons re-export từ lucide-react.
 * Giữ tên cũ (HeartIcon, StarIcon, etc.) để code khác không phải đổi import.
 * Filled prop được wrap cho Heart và Star.
 */
import {
  Heart,
  Star,
  Search,
  ChevronLeft as LCChevronLeft,
  ChevronRight as LCChevronRight,
  ChevronDown as LCChevronDown,
  MapPin,
  Calendar,
  Users,
  Globe,
  Menu,
  SlidersHorizontal,
  Check,
  Home,
  Mountain,
  Waves,
  Building2,
  MessageCircle,
  X,
  BedDouble,
  Hotel,
  UsersRound,
  Coins,
  Crown,
  type LucideProps,
} from 'lucide-react';

interface FilledProp {
  filled?: boolean;
}

export function HeartIcon({ filled, ...props }: LucideProps & FilledProp) {
  return <Heart {...props} fill={filled ? 'currentColor' : 'none'} />;
}

export function StarIcon({ filled, ...props }: LucideProps & FilledProp) {
  return <Star {...props} fill={filled ? 'currentColor' : 'none'} />;
}

export const SearchIcon = Search;
export const ChevronLeft = LCChevronLeft;
export const ChevronRight = LCChevronRight;
export const ChevronDown = LCChevronDown;
export const MapPinIcon = MapPin;
export const CalendarIcon = Calendar;
export const UsersIcon = Users;
export const GlobeIcon = Globe;
export const MenuIcon = Menu;
export const FilterIcon = SlidersHorizontal;
export const CheckIcon = Check;
export const HouseIcon = Home;
export const MountainIcon = Mountain;
export const PoolIcon = Waves;
export const CityIcon = Building2;
export const ChatIcon = MessageCircle;
export const CloseIcon = X;
export const BedIcon = BedDouble;
export const HotelIcon = Hotel;
export const GroupIcon = UsersRound;
export const FamilyIcon = Users;
export const CoinsIcon = Coins;
export const CrownIcon = Crown;
export const WaveIcon = Waves;
