// AI Heuristics Engine (Free-Tier Rule-Based Model)
import { MenuItem, OrderItem } from '../lib/db-mock-types';

export interface AISuggestion {
  item: MenuItem;
  reason: string;
  confidence: number; // 0 to 1
}

// 1. Smart Menu Recommendations & AI Upselling Suggestions
export const getAiUpsellSuggestions = (
  cart: OrderItem[], 
  allItems: MenuItem[]
): AISuggestion[] => {
  if (cart.length === 0) {
    // Recommend popular items as base recommendation
    return allItems
      .filter(item => item.popular && item.inStock)
      .slice(0, 2)
      .map(item => ({
        item,
        reason: "Best-selling favorite selected by most customers today",
        confidence: 0.9
      }));
  }

  const suggestions: AISuggestion[] = [];
  const categoriesInCart = new Set(cart.map(i => i.menuItem.category));

  // Heuristic rule: If coffee is in the cart, suggest desserts (perfect pairing)
  if (categoriesInCart.has('coffee')) {
    const desserts = allItems.filter(item => item.category === 'dessert' && item.inStock);
    if (desserts.length > 0) {
      suggestions.push({
        item: desserts[0],
        reason: "Dessert pairing: Goes perfectly with your coffee order",
        confidence: 0.85
      });
    }
  }

  // Heuristic rule: If sides or mains are ordered but no drinks, recommend drinks
  if ((categoriesInCart.has('pizza') || categoriesInCart.has('pasta') || categoriesInCart.has('sides')) && !categoriesInCart.has('drinks') && !categoriesInCart.has('coffee')) {
    const drinks = allItems.filter(item => item.category === 'drinks' && item.inStock);
    if (drinks.length > 0) {
      suggestions.push({
        item: drinks[0],
        reason: "Thirst quencher: Refreshing pairing with your meal",
        confidence: 0.8
      });
    }
  }

  // Fallback / popular upselling items
  const popularUpsells = allItems.filter(item => item.popular && !cart.some(cartItem => cartItem.menuItem.id === item.id) && item.inStock);
  if (popularUpsells.length > 0) {
    suggestions.push({
      item: popularUpsells[0],
      reason: "Popular Choice: Highly rated by our regular diners",
      confidence: 0.75
    });
  }

  return suggestions.slice(0, 2);
};

// 2. Demand Forecasting
export interface ForecastMetric {
  hour: string;
  projectedOrders: number;
  expectedLoad: 'Low' | 'Medium' | 'High' | 'Peak';
  recommendedStaff: number;
}

export const getDemandForecast = (): ForecastMetric[] => {
  const currentHour = new Date().getHours();
  const hours = Array.from({ length: 6 }, (_, i) => {
    const hr = (currentHour + i) % 24;
    return `${hr.toString().padStart(2, '0')}:00`;
  });

  return hours.map((hourStr) => {
    const hour = parseInt(hourStr.split(':')[0]);
    let projectedOrders = 5;
    let expectedLoad: ForecastMetric['expectedLoad'] = 'Low';
    let recommendedStaff = 2;

    // Dinner Peak (7 PM - 10 PM)
    if (hour >= 19 && hour <= 22) {
      projectedOrders = 42;
      expectedLoad = 'Peak';
      recommendedStaff = 6;
    }
    // Lunch Peak (12 PM - 2 PM)
    else if (hour >= 12 && hour <= 14) {
      projectedOrders = 30;
      expectedLoad = 'High';
      recommendedStaff = 5;
    }
    // Coffee/Snack Hours (4 PM - 6 PM)
    else if (hour >= 16 && hour <= 18) {
      projectedOrders = 22;
      expectedLoad = 'Medium';
      recommendedStaff = 4;
    }

    return {
      hour: hourStr,
      projectedOrders,
      expectedLoad,
      recommendedStaff
    };
  });
};
