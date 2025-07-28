import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CurrencyToggle, { CurrencyToggleSimple } from '../../app/components/CurrencyToggle';
import { CURRENCY_INFO } from '../../app/lib/currency';

// Mock the currency module
jest.mock('../../app/lib/currency', () => ({
  CURRENCY_INFO: {
    SGD: { flag: '🇸🇬', name: 'Singapore Dollar' },
    USD: { flag: '🇺🇸', name: 'US Dollar' },
    INR: { flag: '🇮🇳', name: 'Indian Rupee' }
  }
}));

describe('CurrencyToggle', () => {
  const mockOnCurrencyChange = jest.fn();
  const defaultProps = {
    displayCurrency: 'SGD' as const,
    onCurrencyChange: mockOnCurrencyChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default variant', () => {
    it('should render all currency options', () => {
      render(<CurrencyToggle {...defaultProps} />);

      expect(screen.getByText('🇸🇬')).toBeInTheDocument();
      expect(screen.getByText('SGD')).toBeInTheDocument();
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
      expect(screen.getByText('🇮🇳')).toBeInTheDocument();
      expect(screen.getByText('INR')).toBeInTheDocument();
    });

    it('should highlight the selected currency', () => {
      render(<CurrencyToggle {...defaultProps} displayCurrency="USD" />);

      const usdButton = screen.getByText('🇺🇸').closest('button');
      const sgdButton = screen.getByText('🇸🇬').closest('button');

      expect(usdButton).toHaveClass('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600');
      expect(sgdButton).not.toHaveClass('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600');
    });

    it('should show selection indicator for selected currency', () => {
      render(<CurrencyToggle {...defaultProps} displayCurrency="USD" />);

      const usdButton = screen.getByText('🇺🇸').closest('button');
      const indicators = screen.getAllByRole('generic', { hidden: true });
      const indicator = indicators.find(el => el.closest('button') === usdButton);
      expect(indicator).toBeTruthy();
    });

    it('should call onCurrencyChange when currency is clicked', () => {
      render(<CurrencyToggle {...defaultProps} />);

      const usdButton = screen.getByText('🇺🇸').closest('button');
      expect(usdButton).not.toBeNull();
      fireEvent.click(usdButton!);

      expect(mockOnCurrencyChange).toHaveBeenCalledWith('USD');
    });

    it('should apply custom className', () => {
      render(<CurrencyToggle {...defaultProps} className="custom-class" />);

      const container = screen.getByText('🇸🇬').closest('div');
      expect(container).toHaveClass('custom-class');
    });

    it('should have proper accessibility attributes', () => {
      render(<CurrencyToggle {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Compact variant', () => {
    it('should render compact version', () => {
      render(<CurrencyToggle {...defaultProps} variant="compact" />);

      // In compact variant, the text is rendered differently
      expect(screen.getByText(/🇸🇬/)).toBeInTheDocument();
      expect(screen.getByText(/SGD/)).toBeInTheDocument();
      expect(screen.getByText(/🇺🇸/)).toBeInTheDocument();
      expect(screen.getByText(/USD/)).toBeInTheDocument();
      expect(screen.getByText(/🇮🇳/)).toBeInTheDocument();
      expect(screen.getByText(/INR/)).toBeInTheDocument();
    });

    it('should have different styling for compact variant', () => {
      render(<CurrencyToggle {...defaultProps} variant="compact" />);

      const container = screen.getByText(/🇸🇬/).closest('div');
      expect(container).toHaveClass('bg-slate-800/50', 'rounded-lg', 'p-1');
    });

    it('should highlight selected currency in compact variant', () => {
      render(<CurrencyToggle {...defaultProps} variant="compact" displayCurrency="USD" />);

      const usdButton = screen.getByText(/🇺🇸/).closest('button');
      const sgdButton = screen.getByText(/🇸🇬/).closest('button');

      expect(usdButton).toHaveClass('bg-indigo-600', 'text-white');
      expect(sgdButton).toHaveClass('text-slate-400');
    });

    it('should call onCurrencyChange when currency is clicked in compact variant', () => {
      render(<CurrencyToggle {...defaultProps} variant="compact" />);

      const usdButton = screen.getByText(/🇺🇸/).closest('button');
      expect(usdButton).not.toBeNull();
      fireEvent.click(usdButton!);

      expect(mockOnCurrencyChange).toHaveBeenCalledWith('USD');
    });
  });

  describe('CurrencyToggleSimple', () => {
    it('should render simple version with label', () => {
      render(<CurrencyToggleSimple {...defaultProps} />);

      expect(screen.getByText(/🇸🇬/)).toBeInTheDocument();
      expect(screen.getByText(/SGD/)).toBeInTheDocument();
      expect(screen.getByText(/🇺🇸/)).toBeInTheDocument();
      expect(screen.getByText(/USD/)).toBeInTheDocument();
      expect(screen.getByText(/🇮🇳/)).toBeInTheDocument();
      expect(screen.getByText(/INR/)).toBeInTheDocument();
    });

    it('should highlight selected currency in simple variant', () => {
      render(<CurrencyToggleSimple {...defaultProps} displayCurrency="USD" />);

      const usdButton = screen.getByText(/🇺🇸/).closest('button');
      const sgdButton = screen.getByText(/🇸🇬/).closest('button');

      expect(usdButton).toHaveClass('bg-white/10', 'text-white');
      expect(sgdButton).toHaveClass('text-gray-400');
    });

    it('should apply custom className to simple variant', () => {
      render(<CurrencyToggleSimple {...defaultProps} className="custom-class" />);

      const container = screen.getByText(/🇸🇬/).closest('div');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('User interactions', () => {
    it('should handle multiple currency changes', () => {
      render(<CurrencyToggle {...defaultProps} />);

      const usdButton = screen.getByText('🇺🇸').closest('button');
      const inrButton = screen.getByText('🇮🇳').closest('button');
      expect(usdButton).not.toBeNull();
      expect(inrButton).not.toBeNull();
      
      fireEvent.click(usdButton!);
      expect(mockOnCurrencyChange).toHaveBeenCalledWith('USD');

      fireEvent.click(inrButton!);
      expect(mockOnCurrencyChange).toHaveBeenCalledWith('INR');

      expect(mockOnCurrencyChange).toHaveBeenCalledTimes(2);
    });

    it('should not call onCurrencyChange when clicking already selected currency', () => {
      render(<CurrencyToggle {...defaultProps} displayCurrency="SGD" />);

      const sgdButton = screen.getByText('🇸🇬').closest('button');
      expect(sgdButton).not.toBeNull();
      fireEvent.click(sgdButton!);

      expect(mockOnCurrencyChange).toHaveBeenCalledWith('SGD');
    });
  });

  describe('Styling and layout', () => {
    it('should have proper container styling for default variant', () => {
      render(<CurrencyToggle {...defaultProps} />);

      const container = screen.getByText('🇸🇬').closest('div');
      expect(container).toHaveClass(
        'inline-flex',
        'bg-slate-800/70',
        'backdrop-blur-xl',
        'border',
        'border-slate-700/50',
        'rounded-xl',
        'p-1'
      );
    });

    it('should have proper button styling for default variant', () => {
      render(<CurrencyToggle {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass(
          'flex',
          'items-center',
          'gap-2',
          'px-4',
          'py-2',
          'rounded-lg',
          'text-sm',
          'font-medium',
          'transition-all',
          'duration-300',
          'ease-out'
        );
      });
    });

    it('should have proper button styling for compact variant', () => {
      render(<CurrencyToggle {...defaultProps} variant="compact" />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass(
          'px-2',
          'py-1',
          'rounded',
          'text-xs',
          'font-medium',
          'transition-all',
          'duration-200'
        );
      });
    });

    it('should have proper button styling for simple variant', () => {
      render(<CurrencyToggleSimple {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass(
          'px-2.5',
          'py-2',
          'rounded-lg',
          'text-sm',
          'font-medium',
          'transition-all',
          'duration-200',
          'min-w-[44px]',
          'min-h-[44px]',
          'flex',
          'items-center',
          'justify-center'
        );
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty className prop', () => {
      render(<CurrencyToggle {...defaultProps} className="" />);

      const container = screen.getByText('🇸🇬').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('should handle undefined className prop', () => {
      render(<CurrencyToggle {...defaultProps} />);

      const container = screen.getByText('🇸🇬').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('should render all currencies from CURRENCY_INFO', () => {
      const currencyCodes = Object.keys(CURRENCY_INFO);
      
      render(<CurrencyToggle {...defaultProps} />);

      currencyCodes.forEach(code => {
        const info = CURRENCY_INFO[code as keyof typeof CURRENCY_INFO];
        expect(screen.getByText(new RegExp(info.flag))).toBeInTheDocument();
        expect(screen.getByText(new RegExp(code))).toBeInTheDocument();
      });
    });
  });
}); 