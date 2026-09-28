"use client";

import { useEffect, useState } from "react";
import { CatalogService } from "@/services/catalog.service";
import { Category, Subcategory } from "@/types/service-request";
import { useRouter } from "next/navigation";

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const router = useRouter();

  useEffect(() => {
    CatalogService.getCategories().then(setCategories);
  }, []);

  const handleCatClick = (id: string) => {
    setSelectedCat(id);
    CatalogService.getSubcategories(id).then(setSubcategories);
  };

  const startRequest = (subcatId: string) => {
    router.push(`/services/request/${selectedCat}/${subcatId}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Catálogo de Servicios</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl mb-4">1. Selecciona Categoría</h2>
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <button 
                key={c.id} 
                onClick={() => handleCatClick(c.id)}
                className={`p-4 border rounded ${selectedCat === c.id ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        {selectedCat && (
          <div>
            <h2 className="text-xl mb-4">2. Selecciona Subcategoría</h2>
            <div className="flex flex-col gap-2">
              {subcategories.map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => startRequest(s.id)}
                  className="p-4 border rounded bg-white hover:bg-gray-50"
                >
                  {s.name} - Solicitar Servicio
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
