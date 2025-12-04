/**
 * WeightChartSection - Weight tracking with visual chart for PDF
 * Creates a simple line chart representation using PDF primitives
 */
import { View, Text } from '@react-pdf/renderer';
import { sharedStyles, BRAND_COLORS, formatDate, formatWeight } from '@/lib/pdfExport';
import type { PacketData } from '@/types';

interface WeightChartSectionProps {
  data: PacketData;
}

export function WeightChartSection({ data }: WeightChartSectionProps) {
  const { weightEntries } = data;
  
  // Sort entries by date ascending for the chart
  const sortedEntries = [...weightEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  if (sortedEntries.length === 0) {
    return (
      <View style={sharedStyles.section}>
        <View style={sharedStyles.sectionHeader}>
          <Text style={sharedStyles.sectionTitle}>Weight History</Text>
        </View>
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.body}>No weight records on file.</Text>
        </View>
      </View>
    );
  }
  
  // Calculate chart dimensions and data
  const chartWidth = 480;
  const chartHeight = 150;
  const padding = { top: 20, right: 40, bottom: 30, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  
  // Get min/max values for scaling
  const weights = sortedEntries.map(e => e.weightLbs);
  const minWeight = Math.floor(Math.min(...weights) * 0.9);
  const maxWeight = Math.ceil(Math.max(...weights) * 1.1);
  const weightRange = maxWeight - minWeight || 1;
  
  // Calculate y position for each point
  const getY = (weight: number) => {
    return padding.top + innerHeight - ((weight - minWeight) / weightRange * innerHeight);
  };
  
  // Calculate x position for each point
  const getX = (index: number) => {
    if (sortedEntries.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (sortedEntries.length - 1)) * innerWidth;
  };
  
  // Get current weight (most recent)
  const currentWeight = sortedEntries[sortedEntries.length - 1];
  const startWeight = sortedEntries[0];
  const weightChange = currentWeight.weightLbs - startWeight.weightLbs;
  
  return (
    <View style={sharedStyles.section}>
      {/* Section Header */}
      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Weight History</Text>
      </View>
      
      {/* Summary cards */}
      <View style={{
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
      }}>
        <View style={{
          ...sharedStyles.card,
          flex: 1,
          alignItems: 'center',
          padding: 10,
        }}>
          <Text style={sharedStyles.label}>CURRENT WEIGHT</Text>
          <Text style={{
            fontSize: 18,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            color: BRAND_COLORS.brown,
          }}>
            {formatWeight(currentWeight.weightLbs)}
          </Text>
          <Text style={{
            fontSize: 7,
            color: BRAND_COLORS.gray[500],
          }}>
            as of {formatDate(currentWeight.date)}
          </Text>
        </View>
        
        <View style={{
          ...sharedStyles.card,
          flex: 1,
          alignItems: 'center',
          padding: 10,
        }}>
          <Text style={sharedStyles.label}>STARTING WEIGHT</Text>
          <Text style={{
            fontSize: 18,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            color: BRAND_COLORS.gray[600],
          }}>
            {formatWeight(startWeight.weightLbs)}
          </Text>
          <Text style={{
            fontSize: 7,
            color: BRAND_COLORS.gray[500],
          }}>
            on {formatDate(startWeight.date)}
          </Text>
        </View>
        
        <View style={{
          ...sharedStyles.card,
          flex: 1,
          alignItems: 'center',
          padding: 10,
        }}>
          <Text style={sharedStyles.label}>TOTAL CHANGE</Text>
          <Text style={{
            fontSize: 18,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            color: weightChange >= 0 ? '#22c55e' : '#ef4444',
          }}>
            {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} lbs
          </Text>
          <Text style={{
            fontSize: 7,
            color: BRAND_COLORS.gray[500],
          }}>
            {sortedEntries.length} records
          </Text>
        </View>
      </View>
      
      {/* Growth Chart */}
      <View style={{
        ...sharedStyles.card,
        padding: 15,
      }}>
        <Text style={{
          ...sharedStyles.cardTitle,
          marginBottom: 10,
        }}>
          Growth Chart
        </Text>
        
        {/* Chart container */}
        <View style={{
          width: chartWidth,
          height: chartHeight,
          position: 'relative',
        }}>
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const weight = minWeight + (weightRange * (1 - fraction));
            const y = padding.top + innerHeight * fraction;
            return (
              <View key={fraction} style={{
                position: 'absolute',
                left: 0,
                top: y - 4,
                width: padding.left - 5,
                alignItems: 'flex-end',
              }}>
                <Text style={{ fontSize: 7, color: BRAND_COLORS.gray[500] }}>
                  {weight.toFixed(1)}
                </Text>
              </View>
            );
          })}
          
          {/* Y-axis label */}
          <View style={{
            position: 'absolute',
            left: 2,
            top: padding.top + innerHeight / 2 - 20,
            transform: 'rotate(-90deg)',
          }}>
            <Text style={{ fontSize: 7, color: BRAND_COLORS.gray[500] }}>
              Weight (lbs)
            </Text>
          </View>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <View
              key={`grid-${fraction}`}
              style={{
                position: 'absolute',
                left: padding.left,
                top: padding.top + innerHeight * fraction,
                width: innerWidth,
                height: 1,
                backgroundColor: BRAND_COLORS.gray[200],
              }}
            />
          ))}
          
          {/* Data points and connecting lines */}
          {sortedEntries.map((entry, index) => {
            const x = getX(index);
            const y = getY(entry.weightLbs);
            
            return (
              <View key={entry.id}>
                {/* Point */}
                <View style={{
                  position: 'absolute',
                  left: x - 4,
                  top: y - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: BRAND_COLORS.brown,
                  borderWidth: 2,
                  borderColor: BRAND_COLORS.beige,
                }} />
              </View>
            );
          })}
          
          {/* Line connecting points (simplified - just show area under curve) */}
          {sortedEntries.length > 1 && (
            <View style={{
              position: 'absolute',
              left: padding.left,
              top: padding.top,
              width: innerWidth,
              height: innerHeight,
              backgroundColor: BRAND_COLORS.brown + '10', // Very light brown
              borderTopWidth: 2,
              borderTopColor: BRAND_COLORS.brown,
            }} />
          )}
          
          {/* X-axis baseline */}
          <View style={{
            position: 'absolute',
            left: padding.left,
            top: padding.top + innerHeight,
            width: innerWidth,
            height: 1,
            backgroundColor: BRAND_COLORS.gray[400],
          }} />
          
          {/* Y-axis line */}
          <View style={{
            position: 'absolute',
            left: padding.left,
            top: padding.top,
            width: 1,
            height: innerHeight,
            backgroundColor: BRAND_COLORS.gray[400],
          }} />
          
          {/* X-axis labels (show first, middle, last dates) */}
          {sortedEntries.length > 0 && (
            <>
              <View style={{
                position: 'absolute',
                left: padding.left - 20,
                top: padding.top + innerHeight + 5,
                width: 50,
              }}>
                <Text style={{ fontSize: 6, color: BRAND_COLORS.gray[500], textAlign: 'center' }}>
                  {new Date(startWeight.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              {sortedEntries.length > 2 && (
                <View style={{
                  position: 'absolute',
                  left: padding.left + innerWidth / 2 - 25,
                  top: padding.top + innerHeight + 5,
                  width: 50,
                }}>
                  <Text style={{ fontSize: 6, color: BRAND_COLORS.gray[500], textAlign: 'center' }}>
                    {new Date(sortedEntries[Math.floor(sortedEntries.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              )}
              <View style={{
                position: 'absolute',
                left: padding.left + innerWidth - 30,
                top: padding.top + innerHeight + 5,
                width: 50,
              }}>
                <Text style={{ fontSize: 6, color: BRAND_COLORS.gray[500], textAlign: 'center' }}>
                  {new Date(currentWeight.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
      
      {/* Weight Log Table */}
      {sortedEntries.length > 0 && (
        <View style={{ marginTop: 15 }}>
          <Text style={sharedStyles.h3}>Weight Log</Text>
          
          {/* Table */}
          <View style={sharedStyles.table}>
            {/* Header */}
            <View style={sharedStyles.tableHeader}>
              <Text style={{ ...sharedStyles.tableHeaderCell, width: '30%' }}>Date</Text>
              <Text style={{ ...sharedStyles.tableHeaderCell, width: '25%' }}>Weight</Text>
              <Text style={{ ...sharedStyles.tableHeaderCell, width: '20%' }}>Change</Text>
              <Text style={{ ...sharedStyles.tableHeaderCell, width: '25%' }}>Notes</Text>
            </View>
            
            {/* Rows - show most recent first, limit to 15 */}
            {[...sortedEntries].reverse().slice(0, 15).map((entry, index, arr) => {
              // Calculate change from previous entry
              const prevEntry = arr[index + 1];
              const change = prevEntry 
                ? entry.weightLbs - prevEntry.weightLbs 
                : 0;
              
              return (
                <View 
                  key={entry.id} 
                  style={index % 2 === 0 ? sharedStyles.tableRow : sharedStyles.tableRowAlt}
                >
                  <Text style={{ ...sharedStyles.tableCell, width: '30%' }}>
                    {formatDate(entry.date)}
                  </Text>
                  <Text style={{ ...sharedStyles.tableCell, width: '25%', fontFamily: 'Helvetica', fontWeight: 'bold' }}>
                    {formatWeight(entry.weightLbs)}
                  </Text>
                  <Text style={{ 
                    ...sharedStyles.tableCell, 
                    width: '20%',
                    color: change > 0 ? '#22c55e' : change < 0 ? '#ef4444' : BRAND_COLORS.gray[500],
                  }}>
                    {prevEntry ? (change >= 0 ? '+' : '') + change.toFixed(1) : '-'}
                  </Text>
                  <Text style={{ ...sharedStyles.tableCell, width: '25%' }}>
                    {entry.notes || '-'}
                  </Text>
                </View>
              );
            })}
          </View>
          
          {sortedEntries.length > 15 && (
            <Text style={{
              ...sharedStyles.caption,
              marginTop: 4,
              textAlign: 'right',
            }}>
              Showing 15 most recent of {sortedEntries.length} total entries
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

