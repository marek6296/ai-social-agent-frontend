import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Rect, G, Line, Text as SvgText } from 'react-native-svg';
import { theme } from '../theme';

interface SimpleBarChartProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
}

export function SimpleBarChart({ 
  data, 
  labels, 
  width = 300, 
  height = 200, 
  color = theme.colors.primary 
}: SimpleBarChartProps) {
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { maxValue, barWidth } = useMemo(() => {
    if (data.length === 0) return { maxValue: 1, barWidth: 0 };
    const max = Math.max(...data, 1);
    const barW = chartWidth / data.length - 2;
    return { maxValue: max, barWidth: Math.max(barW, 2) };
  }, [data, chartWidth]);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * (1 - ratio);
          const value = maxValue * ratio;
          return (
            <G key={i}>
              <Line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke={theme.colors.border + '40'}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <SvgText
                x={padding.left - 10}
                y={y + 4}
                fontSize="10"
                fill={theme.colors.mutedForeground}
                textAnchor="end"
              >
                {Math.round(value)}
              </SvgText>
            </G>
          );
        })}
        
        {/* Bars */}
        {data.map((value, index) => {
          const barX = padding.left + (index * stepX) + 1;
          const barHeight = (value / maxValue) * chartHeight;
          const barY = padding.top + chartHeight - barHeight;
          
          return (
            <G key={index}>
              <Rect
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
              />
              {labels && labels[index] && index % 4 === 0 && (
                <SvgText
                  x={barX + barWidth / 2}
                  y={height - 10}
                  fontSize="9"
                  fill={theme.colors.mutedForeground}
                  textAnchor="middle"
                >
                  {labels[index].slice(0, 2)}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

