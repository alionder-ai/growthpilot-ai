/**
 * Unit tests for Target Audience UI Components
 * 
 * Tests ImportanceScoreBar, CustomerSegmentCard, AnalysisDisplay, and TargetAudienceForm
 * components with various props, states, and user interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImportanceScoreBar } from '@/components/ai/ImportanceScoreBar';
import { CustomerSegmentCard } from '@/components/ai/CustomerSegmentCard';
import { AnalysisDisplay } from '@/components/ai/AnalysisDisplay';
import { TargetAudienceForm } from '@/components/ai/TargetAudienceForm';
import {
  CustomerSegment,
  UnnecessaryCustomer,
  StrategicAnalysis,
} from '@/lib/types/target-audience';

describe('ImportanceScoreBar', () => {
  it('should render with correct score and label', () => {
    render(<ImportanceScoreBar score={8} label="Test Score" />);
    
    expect(screen.getByText('Test Score')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
  });

  it('should render low score (1-3) with red color', () => {
    const { container } = render(<ImportanceScoreBar score={2} label="Low Score" />);
    
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-red-500');
  });

  it('should render medium score (4-6) with yellow color', () => {
    const { container } = render(<ImportanceScoreBar score={5} label="Medium Score" />);
    
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-yellow-500');
  });

  it('should render high score (7-10) with green color', () => {
    const { container } = render(<ImportanceScoreBar score={9} label="High Score" />);
    
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-green-500');
  });

  it('should clamp score above 10 to 10', () => {
    render(<ImportanceScoreBar score={15} label="Clamped Score" />);
    
    expect(screen.getByText('10/10')).toBeInTheDocument();
  });

  it('should clamp score below 1 to 1', () => {
    render(<ImportanceScoreBar score={-5} label="Clamped Score" />);
    
    expect(screen.getByText('1/10')).toBeInTheDocument();
  });

  it('should set correct width percentage for progress bar', () => {
    const { container } = render(<ImportanceScoreBar score={7} label="Test" />);
    
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveStyle({ width: '70%' });
  });

  it('should have proper ARIA attributes', () => {
    const { container } = render(<ImportanceScoreBar score={6} label="Accessibility Test" />);
    
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '6');
    expect(progressBar).toHaveAttribute('aria-valuemin', '1');
    expect(progressBar).toHaveAttribute('aria-valuemax', '10');
    expect(progressBar).toHaveAttribute('aria-label', 'Accessibility Test: 6 üzerinden 10');
  });
});

describe('CustomerSegmentCard', () => {
  const mockPerfectSegment: CustomerSegment = {
    profil: 'Yüksek gelirli, teknoloji meraklısı profesyoneller',
    icselArzular: [
      { text: 'Özgüven kazanmak', score: 9 },
      { text: 'Kendini değerli hissetmek', score: 8 },
      { text: 'Başarılı görünmek', score: 7 },
    ],
    dissalArzular: [
      { text: 'Daha genç görünmek', score: 9 },
      { text: 'Profesyonel imaj', score: 8 },
      { text: 'Sosyal beğeni', score: 6 },
    ],
    icselEngeller: [
      { text: 'Sonuç alamama korkusu', score: 8 },
      { text: 'Zaman ayıramama', score: 6 },
      { text: 'Kararsızlık', score: 5 },
    ],
    dissalEngeller: [
      { text: 'Yüksek fiyat', score: 9 },
      { text: 'Güven eksikliği', score: 7 },
      { text: 'Ulaşım zorluğu', score: 4 },
    ],
    ihtiyaclar: [
      { text: 'Hızlı sonuç garantisi', score: 9 },
      { text: 'Esnek randevu', score: 8 },
      { text: 'Ödeme kolaylığı', score: 7 },
    ],
  };

  const mockUnnecessaryCustomer: UnnecessaryCustomer = {
    profil: 'Düşük bütçeli, sürekli indirim bekleyen, sadakatsiz müşteriler',
  };

  it('should render perfect customer segment with green border', () => {
    const { container } = render(
      <CustomerSegmentCard
        segment={mockPerfectSegment}
        type="perfect"
        title="Mükemmel Müşteri"
      />
    );
    
    expect(screen.getByText('Mükemmel Müşteri')).toBeInTheDocument();
    const card = container.querySelector('.border-green-500');
    expect(card).toBeInTheDocument();
  });

  it('should render necessary customer segment with yellow border', () => {
    const { container } = render(
      <CustomerSegmentCard
        segment={mockPerfectSegment}
        type="necessary"
        title="Mecburi Müşteri"
      />
    );
    
    expect(screen.getByText('Mecburi Müşteri')).toBeInTheDocument();
    const card = container.querySelector('.border-yellow-500');
    expect(card).toBeInTheDocument();
  });

  it('should render unnecessary customer segment with red border', () => {
    const { container } = render(
      <CustomerSegmentCard
        segment={mockUnnecessaryCustomer}
        type="unnecessary"
        title="Gereksiz Müşteri"
      />
    );
    
    expect(screen.getByText('Gereksiz Müşteri')).toBeInTheDocument();
    const card = container.querySelector('.border-red-500');
    expect(card).toBeInTheDocument();
  });

  it('should display profile section', () => {
    render(
      <CustomerSegmentCard
        segment={mockPerfectSegment}
        type="perfect"
        title="Test"
      />
    );
    
    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText(mockPerfectSegment.profil)).toBeInTheDocument();
  });

  it('should render all collapsible sections for full segment', () => {
    render(
      <CustomerSegmentCard
        segment={mockPerfectSegment}
        type="perfect"
        title="Test"
      />
    );
    
    expect(screen.getByText('İçsel Arzular')).toBeInTheDocument();
    expect(screen.getByText('Dışsal Arzular')).toBeInTheDocument();
    expect(screen.getByText('İçsel Engeller')).toBeInTheDocument();
    expect(screen.getByText('Dışsal Engeller')).toBeInTheDocument();
    expect(screen.getByText('İhtiyaçlar')).toBeInTheDocument();
  });

  it('should not render collapsible sections for unnecessary customer', () => {
    render(
      <CustomerSegmentCard
        segment={mockUnnecessaryCustomer}
        type="unnecessary"
        title="Test"
      />
    );
    
    expect(screen.queryByText('İçsel Arzular')).not.toBeInTheDocument();
    expect(screen.queryByText('Dışsal Arzular')).not.toBeInTheDocument();
    expect(screen.queryByText('İçsel Engeller')).not.toBeInTheDocument();
    expect(screen.queryByText('Dışsal Engeller')).not.toBeInTheDocument();
    expect(screen.queryByText('İhtiyaçlar')).not.toBeInTheDocument();
  });

  it('should toggle collapsible section on click', async () => {
    render(
      <CustomerSegmentCard
        segment={mockPerfectSegment}
        type="perfect"
        title="Test"
      />
    );
    
    const sectionButton = screen.getByRole('button', { name: /İçsel Arzular/i });
    
    // Initially open - should show items
    expect(screen.getByText('Özgüven kazanmak')).toBeInTheDocument();
    
    // Click to close
    fireEvent.click(sectionButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Özgüven kazanmak')).not.toBeInTheDocument();
    });
    
    // Click to open again
    fireEvent.click(sectionButton);
    
    await waitFor(() => {
      expect(screen.getByText('Özgüven kazanmak')).toBeInTheDocument();
    });
  });

  it('should render importance scores for all items', () => {
    render(
      <CustomerSegmentCard
        segment={mockPerfectSegment}
        type="perfect"
        title="Test"
      />
    );
    
    // Check that score bars are rendered (multiple "Önem Skoru" labels)
    const scoreLabels = screen.getAllByText('Önem Skoru');
    expect(scoreLabels.length).toBeGreaterThan(0);
  });

  it('should have proper aria-expanded attribute on collapsible sections', () => {
    render(
      <CustomerSegmentCard
        segment={mockPerfectSegment}
        type="perfect"
        title="Test"
      />
    );
    
    const sectionButton = screen.getByRole('button', { name: /İçsel Arzular/i });
    expect(sectionButton).toHaveAttribute('aria-expanded', 'true');
    
    fireEvent.click(sectionButton);
    
    expect(sectionButton).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('AnalysisDisplay', () => {
  const mockAnalysis: StrategicAnalysis = {
    mukemmelMusteri: {
      profil: 'Mükemmel müşteri profili',
      icselArzular: [
        { text: 'İçsel arzu 1', score: 9 },
        { text: 'İçsel arzu 2', score: 8 },
        { text: 'İçsel arzu 3', score: 7 },
      ],
      dissalArzular: [
        { text: 'Dışsal arzu 1', score: 9 },
        { text: 'Dışsal arzu 2', score: 8 },
        { text: 'Dışsal arzu 3', score: 7 },
      ],
      icselEngeller: [
        { text: 'İçsel engel 1', score: 8 },
        { text: 'İçsel engel 2', score: 6 },
        { text: 'İçsel engel 3', score: 5 },
      ],
      dissalEngeller: [
        { text: 'Dışsal engel 1', score: 9 },
        { text: 'Dışsal engel 2', score: 7 },
        { text: 'Dışsal engel 3', score: 4 },
      ],
      ihtiyaclar: [
        { text: 'İhtiyaç 1', score: 9 },
        { text: 'İhtiyaç 2', score: 8 },
        { text: 'İhtiyaç 3', score: 7 },
      ],
    },
    mecburiMusteri: {
      profil: 'Mecburi müşteri profili',
      icselArzular: [
        { text: 'İçsel arzu 1', score: 8 },
        { text: 'İçsel arzu 2', score: 7 },
        { text: 'İçsel arzu 3', score: 6 },
      ],
      dissalArzular: [
        { text: 'Dışsal arzu 1', score: 8 },
        { text: 'Dışsal arzu 2', score: 7 },
        { text: 'Dışsal arzu 3', score: 6 },
      ],
      icselEngeller: [
        { text: 'İçsel engel 1', score: 9 },
        { text: 'İçsel engel 2', score: 8 },
        { text: 'İçsel engel 3', score: 7 },
      ],
      dissalEngeller: [
        { text: 'Dışsal engel 1', score: 9 },
        { text: 'Dışsal engel 2', score: 8 },
        { text: 'Dışsal engel 3', score: 7 },
      ],
      ihtiyaclar: [
        { text: 'İhtiyaç 1', score: 8 },
        { text: 'İhtiyaç 2', score: 7 },
        { text: 'İhtiyaç 3', score: 6 },
      ],
    },
    gereksizMusteri: {
      profil: 'Gereksiz müşteri profili',
    },
    reddedilemezTeklifler: {
      mukemmelMusteriTeklif: 'Mükemmel müşteri için özel teklif',
      mecburiMusteriTeklif: 'Mecburi müşteri için teklif',
      gereksizMusteriTeklif: 'Gereksiz müşteri için filtreleme teklifi',
    },
  };

  it('should render all three customer segment cards', () => {
    render(<AnalysisDisplay analysis={mockAnalysis} />);
    
    expect(screen.getByText('Mükemmel Müşteri')).toBeInTheDocument();
    expect(screen.getByText('Mecburi Müşteri')).toBeInTheDocument();
    expect(screen.getByText('Gereksiz Müşteri')).toBeInTheDocument();
  });

  it('should render offers section', () => {
    render(<AnalysisDisplay analysis={mockAnalysis} />);
    
    expect(screen.getByText('Reddedilemez Teklifler')).toBeInTheDocument();
  });

  it('should render all three offer cards', () => {
    render(<AnalysisDisplay analysis={mockAnalysis} />);
    
    expect(screen.getByText('Mükemmel Müşteri Teklifi')).toBeInTheDocument();
    expect(screen.getByText('Mecburi Müşteri Teklifi')).toBeInTheDocument();
    expect(screen.getByText('Gereksiz Müşteri Teklifi')).toBeInTheDocument();
  });

  it('should display offer content', () => {
    render(<AnalysisDisplay analysis={mockAnalysis} />);
    
    expect(screen.getByText('Mükemmel müşteri için özel teklif')).toBeInTheDocument();
    expect(screen.getByText('Mecburi müşteri için teklif')).toBeInTheDocument();
    expect(screen.getByText('Gereksiz müşteri için filtreleme teklifi')).toBeInTheDocument();
  });

  it('should display all customer profiles', () => {
    render(<AnalysisDisplay analysis={mockAnalysis} />);
    
    expect(screen.getByText('Mükemmel müşteri profili')).toBeInTheDocument();
    expect(screen.getByText('Mecburi müşteri profili')).toBeInTheDocument();
    expect(screen.getByText('Gereksiz müşteri profili')).toBeInTheDocument();
  });

  it('should render responsive grid layout', () => {
    const { container } = render(<AnalysisDisplay analysis={mockAnalysis} />);
    
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('lg:grid-cols-2');
  });
});

describe('TargetAudienceForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render form with label and input', () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    expect(screen.getByLabelText('Sektör/Endüstri')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Örn: Güzellik Merkezi/i)).toBeInTheDocument();
  });

  it('should render submit button with correct text', () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    expect(screen.getByRole('button', { name: 'Analiz Et' })).toBeInTheDocument();
  });

  it('should show validation error for empty input', async () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const submitButton = screen.getByRole('button', { name: 'Analiz Et' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Bu alan zorunludur')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for whitespace-only input', async () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByLabelText('Sektör/Endüstri');
    fireEvent.change(input, { target: { value: '   ' } });
    
    const submitButton = screen.getByRole('button', { name: 'Analiz Et' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Bu alan zorunludur')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with trimmed value for valid input', async () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByLabelText('Sektör/Endüstri');
    fireEvent.change(input, { target: { value: '  Güzellik Merkezi  ' } });
    
    const submitButton = screen.getByRole('button', { name: 'Analiz Et' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Güzellik Merkezi');
    });
  });

  it('should clear validation error when user starts typing', async () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const submitButton = screen.getByRole('button', { name: 'Analiz Et' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Bu alan zorunludur')).toBeInTheDocument();
    });
    
    const input = screen.getByLabelText('Sektör/Endüstri');
    fireEvent.change(input, { target: { value: 'G' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Bu alan zorunludur')).not.toBeInTheDocument();
    });
  });

  it('should show loading state when isLoading is true', () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={true} />);
    
    expect(screen.getByText('Analiz Ediliyor...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should disable input when loading', () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={true} />);
    
    const input = screen.getByLabelText('Sektör/Endüstri');
    expect(input).toBeDisabled();
  });

  it('should display external error message', () => {
    render(
      <TargetAudienceForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        error="Analiz oluşturulurken bir hata oluştu"
      />
    );
    
    expect(screen.getByText('Analiz oluşturulurken bir hata oluştu')).toBeInTheDocument();
  });

  it('should prioritize validation error over external error', async () => {
    render(
      <TargetAudienceForm
        onSubmit={mockOnSubmit}
        isLoading={false}
        error="External error"
      />
    );
    
    const submitButton = screen.getByRole('button', { name: 'Analiz Et' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Bu alan zorunludur')).toBeInTheDocument();
      expect(screen.queryByText('External error')).not.toBeInTheDocument();
    });
  });

  it('should have proper ARIA attributes for error state', async () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const submitButton = screen.getByRole('button', { name: 'Analiz Et' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const input = screen.getByLabelText('Sektör/Endüstri');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'industry-error');
    });
  });

  it('should not have error ARIA attributes when no error', () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByLabelText('Sektör/Endüstri');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('should handle form submission via Enter key', async () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByLabelText('Sektör/Endüstri');
    fireEvent.change(input, { target: { value: 'E-ticaret' } });
    fireEvent.submit(input.closest('form')!);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('E-ticaret');
    });
  });

  it('should accept Turkish characters in input', async () => {
    render(<TargetAudienceForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const input = screen.getByLabelText('Sektör/Endüstri');
    fireEvent.change(input, { target: { value: 'Güzellik Merkezi İşletmesi' } });
    
    const submitButton = screen.getByRole('button', { name: 'Analiz Et' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('Güzellik Merkezi İşletmesi');
    });
  });

  it('should show spinner icon when loading', () => {
    const { container } = render(
      <TargetAudienceForm onSubmit={mockOnSubmit} isLoading={true} />
    );
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
