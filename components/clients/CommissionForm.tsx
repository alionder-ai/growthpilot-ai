'use client';

import { useState, useEffect } from 'react';
import { CommissionModel } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { isValidCommissionPercentage } from '@/lib/utils/commission';

interface CommissionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: string;
  clientName: string;
  commissionModel?: CommissionModel | null;
}

export default function CommissionForm({
  open,
  onClose,
  onSuccess,
  clientId,
  clientName,
  commissionModel,
}: CommissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    commission_percentage: '',
    calculation_basis: 'sales_revenue' as 'sales_revenue' | 'total_revenue',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or commission model changes
  useEffect(() => {
    if (open) {
      if (commissionModel) {
        setFormData({
          commission_percentage: commissionModel.commission_percentage.toString(),
          calculation_basis: commissionModel.calculation_basis,
        });
      } else {
        setFormData({
          commission_percentage: '',
          calculation_basis: 'sales_revenue',
        });
      }
      setError(null);
      setValidationErrors({});
    }
  }, [open, commissionModel]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate commission percentage
    if (!formData.commission_percentage.trim()) {
      errors.commission_percentage = 'Komisyon yüzdesi zorunludur';
    } else {
      const percentage = parseFloat(formData.commission_percentage);
      
      if (isNaN(percentage)) {
        errors.commission_percentage = 'Geçerli bir sayı giriniz';
      } else if (!isValidCommissionPercentage(percentage)) {
        errors.commission_percentage = 'Komisyon yüzdesi 0 ile 100 arasında olmalıdır';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const percentage = parseFloat(formData.commission_percentage);

      const url = commissionModel
        ? `/api/commission-models/${commissionModel.model_id}`
        : '/api/commission-models';
      const method = commissionModel ? 'PUT' : 'POST';

      const body = commissionModel
        ? {
            commission_percentage: percentage,
            calculation_basis: formData.calculation_basis,
          }
        : {
            client_id: clientId,
            commission_percentage: percentage,
            calculation_basis: formData.calculation_basis,
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    setFormData((prev) => ({ ...prev, commission_percentage: sanitized }));
    
    // Clear validation error for this field
    if (validationErrors.commission_percentage) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.commission_percentage;
        return newErrors;
      });
    }
  };

  const handleCalculationBasisChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      calculation_basis: value as 'sales_revenue' | 'total_revenue',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {commissionModel ? 'Komisyon Modelini Düzenle' : 'Komisyon Modeli Oluştur'}
          </DialogTitle>
          <DialogDescription>
            {clientName} müşterisi için komisyon modelini{' '}
            {commissionModel ? 'güncelleyin' : 'tanımlayın'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Commission Percentage Field */}
            <div className="grid gap-2">
              <Label htmlFor="commission_percentage">
                Komisyon Yüzdesi <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="commission_percentage"
                  type="text"
                  inputMode="decimal"
                  value={formData.commission_percentage}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  placeholder="Örn: 15"
                  disabled={loading}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  %
                </span>
              </div>
              {validationErrors.commission_percentage && (
                <p className="text-sm text-red-500">
                  {validationErrors.commission_percentage}
                </p>
              )}
              <p className="text-xs text-gray-500">
                0 ile 100 arasında bir değer giriniz
              </p>
            </div>

            {/* Calculation Basis Field */}
            <div className="grid gap-3">
              <Label>
                Hesaplama Temeli <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={formData.calculation_basis}
                onValueChange={handleCalculationBasisChange}
                disabled={loading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sales_revenue" id="sales_revenue" />
                  <Label
                    htmlFor="sales_revenue"
                    className="font-normal cursor-pointer"
                  >
                    Satış Geliri
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="total_revenue" id="total_revenue" />
                  <Label
                    htmlFor="total_revenue"
                    className="font-normal cursor-pointer"
                  >
                    Toplam Gelir
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-gray-500">
                Komisyonun hangi gelir türüne göre hesaplanacağını seçiniz
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Kaydediliyor...'
                : commissionModel
                ? 'Güncelle'
                : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
