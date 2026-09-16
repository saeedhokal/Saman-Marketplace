import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModelCombobox } from "@/components/ModelCombobox";

type Props = {
  open: boolean; onClose: () => void; isRTL: boolean; automotive: boolean;
  categories: string[]; category: string; onCategory: (value: string) => void;
  models: string[]; model: string; onModel: (value: string) => void;
  priceMin: string; setPriceMin: (value: string) => void; priceMax: string; setPriceMax: (value: string) => void;
  yearMin: string; setYearMin: (value: string) => void; yearMax: string; setYearMax: (value: string) => void;
  kmMin: string; setKmMin: (value: string) => void; kmMax: string; setKmMax: (value: string) => void;
  condition: string; setCondition: (value: string) => void; clear: () => void;
};

export function DesktopFilterSidebar(p: Props) {
  if (!p.open) return null;
  return <aside className={`desktop-filter-sidebar ${p.open ? "is-open" : ""}`} dir={p.isRTL ? "rtl" : "ltr"}>
    <div className="desktop-filter-sidebar__head"><div><SlidersHorizontal size={17} /><strong>{p.isRTL ? "نتائج التصفية" : "Filter Results"}</strong></div><button onClick={p.onClose} aria-label="Close filters"><X size={18} /></button></div>
    <label>{p.automotive ? (p.isRTL ? "الماركة" : "Make") : (p.isRTL ? "الفئة" : "Category")}</label>
    <Select value={p.category} onValueChange={p.onCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{p.categories.map(x => <SelectItem key={x} value={x}>{x === "All" ? (p.isRTL ? "الكل" : "All") : x}</SelectItem>)}</SelectContent></Select>
    {p.automotive && <><label>{p.isRTL ? "الموديل" : "Model"}</label><ModelCombobox models={p.models} value={p.model} onValueChange={p.onModel} emptyValue="All" emptyLabel={p.isRTL ? "كل الموديلات" : "All models"} disabled={p.category === "All"} /></>}
    <label>{p.isRTL ? "السعر (درهم)" : "Price (AED)"}</label><div className="desktop-filter-pair"><Input type="number" placeholder="Min" value={p.priceMin} onChange={e => p.setPriceMin(e.target.value)} /><Input type="number" placeholder="Max" value={p.priceMax} onChange={e => p.setPriceMax(e.target.value)} /></div>
    {p.automotive && <><label>{p.isRTL ? "السنة" : "Year"}</label><div className="desktop-filter-pair"><Input type="number" placeholder="From" value={p.yearMin} onChange={e => p.setYearMin(e.target.value)} /><Input type="number" placeholder="To" value={p.yearMax} onChange={e => p.setYearMax(e.target.value)} /></div><label>{p.isRTL ? "الكيلومترات" : "Kilometres"}</label><div className="desktop-filter-pair"><Input type="number" placeholder="Min" value={p.kmMin} onChange={e => p.setKmMin(e.target.value)} /><Input type="number" placeholder="Max" value={p.kmMax} onChange={e => p.setKmMax(e.target.value)} /></div></>}
     <label>{p.isRTL ? "الحالة" : "Condition"}</label><Select value={p.condition} onValueChange={p.setCondition}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="used">Used</SelectItem><SelectItem value="refurbished">Refurbished</SelectItem></SelectContent></Select>
    <Button variant="ghost" className="desktop-filter-clear" onClick={() => { p.clear(); p.onClose(); }}>{p.isRTL ? "مسح وإغلاق" : "Clear & close"}</Button>
  </aside>;
}