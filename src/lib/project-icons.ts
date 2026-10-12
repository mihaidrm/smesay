// The icons a PM can put on a project's tile (stories/E3-8, decision 0066, design note 131):
// 24 from Lucide, the app's icon set (docs/assets.md, row 3; ISC), picked for the lists PMs
// validate. The key is what the project row stores (project.icon); the label is the icon's
// accessible name in the picker. A stored key that is not here reads as no icon.
import { Briefcase, Building2, Calendar, Car, ChartBar, ClipboardList, Clock, CreditCard, FileText, Heart, KeyRound, Mail, MapPin, Package, Phone, Plane, Receipt, Shield, ShoppingCart, Store, Truck, UserCheck, Users, Wallet, type LucideIcon } from "lucide-react";

export type ProjectIcon = { key: string; label: string; Icon: LucideIcon };

export const PROJECT_ICONS: readonly ProjectIcon[] = [
  { key: "briefcase", label: "Briefcase", Icon: Briefcase },
  { key: "receipt", label: "Receipt", Icon: Receipt },
  { key: "wallet", label: "Wallet", Icon: Wallet },
  { key: "card", label: "Credit card", Icon: CreditCard },
  { key: "plane", label: "Plane", Icon: Plane },
  { key: "car", label: "Car", Icon: Car },
  { key: "truck", label: "Truck", Icon: Truck },
  { key: "package", label: "Package", Icon: Package },
  { key: "building", label: "Building", Icon: Building2 },
  { key: "store", label: "Store", Icon: Store },
  { key: "cart", label: "Shopping cart", Icon: ShoppingCart },
  { key: "calendar", label: "Calendar", Icon: Calendar },
  { key: "clock", label: "Clock", Icon: Clock },
  { key: "mail", label: "Mail", Icon: Mail },
  { key: "phone", label: "Phone", Icon: Phone },
  { key: "people", label: "People", Icon: Users },
  { key: "person-check", label: "Person with a tick", Icon: UserCheck },
  { key: "shield", label: "Shield", Icon: Shield },
  { key: "key", label: "Key", Icon: KeyRound },
  { key: "document", label: "Document", Icon: FileText },
  { key: "checklist", label: "Checklist", Icon: ClipboardList },
  { key: "chart", label: "Bar chart", Icon: ChartBar },
  { key: "pin", label: "Map pin", Icon: MapPin },
  { key: "heart", label: "Heart", Icon: Heart },
];

export const projectIcon = (key: string | null | undefined): ProjectIcon | null => (key ? (PROJECT_ICONS.find((i) => i.key === key) ?? null) : null);
export const isProjectIcon = (key: unknown): key is string => typeof key === "string" && PROJECT_ICONS.some((i) => i.key === key);
