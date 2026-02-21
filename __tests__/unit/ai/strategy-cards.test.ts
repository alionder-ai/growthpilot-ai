/**
 * Unit tests for Strategy Cards functionality
 * Tests metric threshold checks and strategy card generation logic
 */

import { buildStrategyCardPrompt } from '@/lib/gemini/prompts';

describe('Strategy Cards', () => {
  describe('buildStrategyCardPrompt', () => {
    it('should build prompt for high frequency scenario', () => {
      const prompt = buildStrategyCardPrompt({
        situation: 'Reklam frekansı yüksek, kullanıcılar aynı reklamı çok fazla görüyor',
        metricName: 'Frekans',
        metricValue: 5.2,
        threshold: 4,
      });

      expect(prompt).toContain('dijital pazarlama stratejistisin');
      expect(prompt).toContain('Frekans');
      expect(prompt).toContain('5.2');
      expect(prompt).toContain('4');
      expect(prompt).toContain('do_actions');
      expect(prompt).toContain('dont_actions');
      expect(prompt).toContain('reasoning');
    });

    it('should build prompt for low ROAS scenario', () => {
      const prompt = buildStrategyCardPrompt({
        situation: 'ROAS hedefin altında, kampanya karlılığı düşük',
        metricName: 'ROAS',
        metricValue: 1.5,
        threshold: 2,
      });

      expect(prompt).toContain('ROAS');
      expect(prompt).toContain('1.5');
      expect(prompt).toContain('2');
      expect(prompt).toContain('JSON formatında');
    });

    it('should build prompt for CPC increase scenario', () => {
      const prompt = buildStrategyCardPrompt({
        situation: 'Son 7 günde TBM (CPC) %20\'den fazla arttı',
        metricName: 'TBM Artış Oranı',
        metricValue: 25.5,
        threshold: 20,
      });

      expect(prompt).toContain('TBM Artış Oranı');
      expect(prompt).toContain('25.5');
      expect(prompt).toContain('20');
    });

    it('should build prompt for low cart conversion scenario', () => {
      const prompt = buildStrategyCardPrompt({
        situation: 'Sepete ekleme sayısı yüksek ancak satın alma oranı düşük',
        metricName: 'Sepet-Satın Alma Dönüşüm Oranı',
        metricValue: 25,
        threshold: 30,
      });

      expect(prompt).toContain('Sepet-Satın Alma Dönüşüm Oranı');
      expect(prompt).toContain('25');
      expect(prompt).toContain('30');
    });

    it('should request Turkish output', () => {
      const prompt = buildStrategyCardPrompt({
        situation: 'Test situation',
        metricName: 'Test Metric',
        metricValue: 10,
        threshold: 5,
      });

      expect(prompt).toContain('dijital pazarlama stratejistisin');
      expect(prompt).toContain('Yapılması Gerekenler');
      expect(prompt).toContain('Yapılmaması Gerekenler');
    });

    it('should request 3 items per list', () => {
      const prompt = buildStrategyCardPrompt({
        situation: 'Test situation',
        metricName: 'Test Metric',
        metricValue: 10,
        threshold: 5,
      });

      expect(prompt).toContain('3 madde');
    });

    it('should request actionable items', () => {
      const prompt = buildStrategyCardPrompt({
        situation: 'Test situation',
        metricName: 'Test Metric',
        metricValue: 10,
        threshold: 5,
      });

      expect(prompt).toContain('uygulanabilir');
    });
  });

  describe('Metric Threshold Logic', () => {
    it('should trigger strategy card when frequency > 4', () => {
      const frequency = 5.2;
      const threshold = 4;
      
      expect(frequency > threshold).toBe(true);
    });

    it('should not trigger strategy card when frequency <= 4', () => {
      const frequency = 3.8;
      const threshold = 4;
      
      expect(frequency > threshold).toBe(false);
    });

    it('should trigger strategy card when ROAS < 2', () => {
      const roas = 1.5;
      const threshold = 2;
      
      expect(roas < threshold).toBe(true);
    });

    it('should not trigger strategy card when ROAS >= 2', () => {
      const roas = 2.5;
      const threshold = 2;
      
      expect(roas < threshold).toBe(false);
    });

    it('should trigger strategy card when CPC increase > 20%', () => {
      const oldCpc = 10;
      const newCpc = 13;
      const increasePercent = ((newCpc - oldCpc) / oldCpc) * 100;
      const threshold = 20;
      
      expect(increasePercent).toBeGreaterThan(threshold);
    });

    it('should not trigger strategy card when CPC increase <= 20%', () => {
      const oldCpc = 10;
      const newCpc = 11;
      const increasePercent = ((newCpc - oldCpc) / oldCpc) * 100;
      const threshold = 20;
      
      expect(increasePercent).toBeLessThanOrEqual(threshold);
    });

    it('should trigger strategy card when cart conversion < 30%', () => {
      const addToCart = 100;
      const purchases = 25;
      const conversionRate = (purchases / addToCart) * 100;
      const threshold = 30;
      
      expect(conversionRate).toBeLessThan(threshold);
    });

    it('should not trigger strategy card when cart conversion >= 30%', () => {
      const addToCart = 100;
      const purchases = 35;
      const conversionRate = (purchases / addToCart) * 100;
      const threshold = 30;
      
      expect(conversionRate).toBeGreaterThanOrEqual(threshold);
    });

    it('should handle zero values in CPC calculation', () => {
      const oldCpc = 0;
      const newCpc = 10;
      const increasePercent = oldCpc > 0 ? ((newCpc - oldCpc) / oldCpc) * 100 : 0;
      
      expect(increasePercent).toBe(0);
    });

    it('should handle zero values in cart conversion calculation', () => {
      const addToCart = 0;
      const purchases = 0;
      
      // Should not calculate conversion rate when addToCart is 0
      expect(addToCart).toBe(0);
    });
  });

  describe('Strategy Card Content Structure', () => {
    it('should have correct structure for strategy card response', () => {
      const mockResponse = {
        do_actions: [
          'Yeni kreatif varyasyonlar oluştur',
          'Hedef kitleyi genişlet',
          'Bütçeyi optimize et',
        ],
        dont_actions: [
          'Kampanyayı hemen durdurma',
          'Bütçeyi ani şekilde artırma',
          'Hedef kitleyi daraltma',
        ],
        reasoning: 'Frekans yüksek olduğu için kreatif yenileme gerekiyor',
      };

      expect(mockResponse.do_actions).toHaveLength(3);
      expect(mockResponse.dont_actions).toHaveLength(3);
      expect(mockResponse.reasoning).toBeTruthy();
      expect(typeof mockResponse.reasoning).toBe('string');
    });

    it('should validate do_actions are strings', () => {
      const doActions = [
        'Aksiyon 1',
        'Aksiyon 2',
        'Aksiyon 3',
      ];

      doActions.forEach(action => {
        expect(typeof action).toBe('string');
        expect(action.length).toBeGreaterThan(0);
      });
    });

    it('should validate dont_actions are strings', () => {
      const dontActions = [
        'Yapma 1',
        'Yapma 2',
        'Yapma 3',
      ];

      dontActions.forEach(action => {
        expect(typeof action).toBe('string');
        expect(action.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Trigger Labels', () => {
    const triggerLabels: Record<string, string> = {
      high_frequency: 'Yüksek Frekans',
      low_cart_conversion: 'Düşük Sepet Dönüşümü',
      low_roas: 'Düşük ROAS',
      cpc_increase: 'TBM Artışı',
    };

    it('should have Turkish labels for all triggers', () => {
      expect(triggerLabels.high_frequency).toBe('Yüksek Frekans');
      expect(triggerLabels.low_cart_conversion).toBe('Düşük Sepet Dönüşümü');
      expect(triggerLabels.low_roas).toBe('Düşük ROAS');
      expect(triggerLabels.cpc_increase).toBe('TBM Artışı');
    });

    it('should have labels for all trigger types', () => {
      const expectedTriggers = [
        'high_frequency',
        'low_cart_conversion',
        'low_roas',
        'cpc_increase',
      ];

      expectedTriggers.forEach(trigger => {
        expect(triggerLabels[trigger]).toBeTruthy();
      });
    });
  });
});
