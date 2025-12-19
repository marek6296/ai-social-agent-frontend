import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Svg, Path, G, Text as SvgText } from 'react-native-svg';
import { theme } from '../theme';

interface SimplePieChartProps {
  data: Array<{ label: string; value: number }>;
  colors?: string[];
  width?: number;
  height?: number;
}

export function SimplePieChart({ 
  data, 
  colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'],
  width = 220,
  height = 220 
}: SimplePieChartProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = radius * 0.4;

  const { paths, total } = useMemo(() => {
    if (data.length === 0) return { paths: [], total: 0 };
    
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90; // Start from top
    
    const piePaths = data.map((item, index) => {
      const percentage = item.value / totalValue;
      const angle = percentage * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const x3 = centerX + innerRadius * Math.cos(endAngleRad);
      const y3 = centerY + innerRadius * Math.sin(endAngleRad);
      const x4 = centerX + innerRadius * Math.cos(startAngleRad);
      const y4 = centerY + innerRadius * Math.sin(startAngleRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = `M ${centerX} ${centerY} 
        L ${x1} ${y1} 
        A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} 
        L ${x3} ${y3} 
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} 
        Z`;
      
      currentAngle += angle;
      
      return {
        path,
        color: colors[index % colors.length],
        label: item.label,
        percentage: (percentage * 100).toFixed(1),
      };
    });
    
    return { paths: piePaths, total: totalValue };
  }, [data, colors, centerX, centerY, radius, innerRadius]);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {paths.map((item, index) => (
          <Path
            key={index}
            d={item.path}
            fill={item.color}
            stroke={theme.colors.card}
            strokeWidth="2"
          />
        ))}
      </Svg>
      <View style={styles.legend}>
        {paths.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.label}: {item.percentage}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.foreground,
  },
});


