/**
 * PedigreeSection - 4-generation family tree pedigree chart
 * Uses landscape orientation for better visualization
 */
import { Page, View, Text } from '@react-pdf/renderer';
import { sharedStyles, BRAND_COLORS } from '@/lib/pdfExport';
import type { PacketData, Dog } from '@/types';

interface PedigreeSectionProps {
  data: PacketData;
  generations: 2 | 3 | 4;
}

interface AncestorBoxProps {
  dog: Dog | null;
  label: string;
  position: string;
  compact?: boolean;
}

// Individual ancestor box component
function AncestorBox({ dog, label, compact = false }: AncestorBoxProps) {
  const isMale = dog?.sex === 'M';
  const bgColor = dog 
    ? (isMale ? '#e0f2fe' : '#fce7f3') // light blue/pink
    : BRAND_COLORS.gray[100];
  const borderColor = dog 
    ? (isMale ? '#0284c7' : '#db2777')
    : BRAND_COLORS.gray[300];
    
  return (
    <View style={{
      backgroundColor: bgColor,
      borderWidth: 1,
      borderColor: borderColor,
      borderRadius: 3,
      padding: compact ? 3 : 5,
      marginVertical: compact ? 1 : 2,
      minWidth: compact ? 80 : 100,
      maxWidth: compact ? 100 : 130,
    }}>
      {/* Label */}
      <Text style={{
        fontSize: compact ? 5 : 6,
        color: BRAND_COLORS.gray[500],
        textTransform: 'uppercase',
        marginBottom: 1,
      }}>
        {label}
      </Text>
      
      {/* Name */}
      <Text style={{
        fontSize: compact ? 6 : 8,
        fontFamily: 'Helvetica-Bold',
        color: dog ? BRAND_COLORS.darkBrown : BRAND_COLORS.gray[500],
      }}>
        {dog?.name || 'Unknown'}
      </Text>
      
      {/* Registration */}
      {dog?.registrationNumber && (
        <Text style={{
          fontSize: compact ? 5 : 6,
          fontFamily: 'Courier',
          color: BRAND_COLORS.gray[600],
          marginTop: 1,
        }}>
          {dog.registrationNumber}
        </Text>
      )}
      
      {/* Color */}
      {dog?.color && !compact && (
        <Text style={{
          fontSize: 5,
          color: BRAND_COLORS.gray[500],
          marginTop: 1,
        }}>
          {dog.color}
        </Text>
      )}
    </View>
  );
}

const connectorColor = BRAND_COLORS.gray[300];

function ConnectorColumn({ segments }: { segments: number }) {
  if (segments <= 0) {
    return <View style={{ width: '2%' }} />;
  }

  return (
    <View style={{ width: '3%', height: '100%', flexDirection: 'column' }}>
      {Array.from({ length: segments }).map((_, index) => (
        <View
          key={`connector-${segments}-${index}`}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ flex: 1, width: 1, backgroundColor: connectorColor }} />
          <View style={{ width: '100%', height: 1, backgroundColor: connectorColor }} />
          <View style={{ flex: 1, width: 1, backgroundColor: connectorColor }} />
        </View>
      ))}
    </View>
  );
}

// Helper function to get ancestor from pedigree data
function getAncestor(
  data: PacketData,
  position: string
): Dog | null {
  // Generation 1: Sire (S) and Dam (D)
  if (position === 'S') return data.sire;
  if (position === 'D') return data.dam;
  
  // Generation 2+: Look in pedigreeAncestors
  const ancestor = data.pedigreeAncestors.find(a => a.position === position);
  return ancestor?.dog || null;
}

export function PedigreeSection({ data, generations }: PedigreeSectionProps) {
  const { dog } = data;
  
  // Build tree structure based on generations
  // Gen 1: S (Sire), D (Dam)
  // Gen 2: SS, SD, DS, DD
  // Gen 3: SSS, SSD, SDS, SDD, DSS, DSD, DDS, DDD
  // Gen 4: SSSS, SSSD, SSDS, SSDD, SDSS, SDSD, SDDS, SDDD, DSSS, DSSD, DSDS, DSDD, DDSS, DDSD, DDDS, DDDD
  
  const gen4Compact = generations === 4;
  
  return (
    <Page size="LETTER" orientation="landscape" style={sharedStyles.pageLandscape}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: BRAND_COLORS.brown,
      }}>
        <View>
          <Text style={{
            fontSize: 14,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            color: BRAND_COLORS.brown,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}>
            {generations}-Generation Pedigree
          </Text>
          <Text style={{
            fontSize: 10,
            color: BRAND_COLORS.gray[600],
            marginTop: 2,
          }}>
            {dog.name} • {dog.registrationNumber || 'No registration'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 12,
            fontFamily: 'Helvetica-Bold',
            color: BRAND_COLORS.brown,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            {data.breederSettings.kennelName || 'RESPECTABULLZ'}
          </Text>
        </View>
      </View>
      
      {/* Legend */}
      <View style={{
        flexDirection: 'row',
        marginBottom: 10,
        gap: 15,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 12,
            height: 12,
            backgroundColor: '#e0f2fe',
            borderWidth: 1,
            borderColor: '#0284c7',
            borderRadius: 2,
            marginRight: 4,
          }} />
          <Text style={{ fontSize: 7, color: BRAND_COLORS.gray[600] }}>Male</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 12,
            height: 12,
            backgroundColor: '#fce7f3',
            borderWidth: 1,
            borderColor: '#db2777',
            borderRadius: 2,
            marginRight: 4,
          }} />
          <Text style={{ fontSize: 7, color: BRAND_COLORS.gray[600] }}>Female</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 12,
            height: 12,
            backgroundColor: BRAND_COLORS.gray[100],
            borderWidth: 1,
            borderColor: BRAND_COLORS.gray[300],
            borderRadius: 2,
            marginRight: 4,
          }} />
          <Text style={{ fontSize: 7, color: BRAND_COLORS.gray[600] }}>Unknown</Text>
        </View>
      </View>
      
      {/* Pedigree Tree */}
      <View style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Subject (Generation 0) */}
        <View style={{ width: '12%', alignItems: 'center' }}>
          <View style={{
            backgroundColor: BRAND_COLORS.cream,
            borderWidth: 2,
            borderColor: BRAND_COLORS.brown,
            borderRadius: 5,
            padding: 8,
            alignItems: 'center',
            maxWidth: 120,
          }}>
            <Text style={{
              fontSize: 6,
              color: BRAND_COLORS.gray[500],
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              Subject
            </Text>
            <Text style={{
              fontSize: 10,
              fontFamily: 'Helvetica',
            fontWeight: 'bold',
              color: BRAND_COLORS.brown,
              textAlign: 'center',
            }}>
              {dog.name}
            </Text>
            {dog.registrationNumber && (
              <Text style={{
                fontSize: 7,
                fontFamily: 'Courier',
                color: BRAND_COLORS.gray[600],
                marginTop: 2,
              }}>
                {dog.registrationNumber}
              </Text>
            )}
            {dog.color && (
              <Text style={{
                fontSize: 6,
                color: BRAND_COLORS.gray[500],
                marginTop: 1,
              }}>
                {dog.color}
              </Text>
            )}
          </View>
        </View>
        
        {/* Connecting lines */}
        <ConnectorColumn segments={2} />
        
        {/* Generation 1: Parents */}
        <View style={{ width: '15%' }}>
          <View style={{ marginBottom: 20 }}>
            <AncestorBox 
              dog={getAncestor(data, 'S')} 
              label="Sire (Father)" 
              position="S"
              compact={gen4Compact}
            />
          </View>
          <View>
            <AncestorBox 
              dog={getAncestor(data, 'D')} 
              label="Dam (Mother)" 
              position="D"
              compact={gen4Compact}
            />
          </View>
        </View>
        
        {/* Connecting lines */}
        <ConnectorColumn segments={4} />
        
        {/* Generation 2: Grandparents */}
        <View style={{ width: '15%' }}>
          <View style={{ marginBottom: 5 }}>
            <AncestorBox 
              dog={getAncestor(data, 'SS')} 
              label="Paternal Grandfather" 
              position="SS"
              compact={gen4Compact}
            />
          </View>
          <View style={{ marginBottom: 15 }}>
            <AncestorBox 
              dog={getAncestor(data, 'SD')} 
              label="Paternal Grandmother" 
              position="SD"
              compact={gen4Compact}
            />
          </View>
          <View style={{ marginBottom: 5 }}>
            <AncestorBox 
              dog={getAncestor(data, 'DS')} 
              label="Maternal Grandfather" 
              position="DS"
              compact={gen4Compact}
            />
          </View>
          <View>
            <AncestorBox 
              dog={getAncestor(data, 'DD')} 
              label="Maternal Grandmother" 
              position="DD"
              compact={gen4Compact}
            />
          </View>
        </View>
        
        {generations >= 3 && (
          <>
            {/* Connecting lines */}
            <ConnectorColumn segments={8} />
            
            {/* Generation 3: Great-grandparents */}
            <View style={{ width: '15%' }}>
              {['SSS', 'SSD', 'SDS', 'SDD', 'DSS', 'DSD', 'DDS', 'DDD'].map((pos, i) => (
                <View key={pos} style={{ marginBottom: i % 2 === 1 ? 8 : 2 }}>
                  <AncestorBox 
                    dog={getAncestor(data, pos)} 
                    label={getGen3Label(pos)}
                    position={pos}
                    compact={gen4Compact}
                  />
                </View>
              ))}
            </View>
          </>
        )}
        
        {generations >= 4 && (
          <>
            {/* Connecting lines */}
            <ConnectorColumn segments={16} />
            
            {/* Generation 4: Great-great-grandparents */}
            <View style={{ width: '20%' }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {['SSSS', 'SSSD', 'SSDS', 'SSDD', 'SDSS', 'SDSD', 'SDDS', 'SDDD',
                  'DSSS', 'DSSD', 'DSDS', 'DSDD', 'DDSS', 'DDSD', 'DDDS', 'DDDD'].map((pos) => (
                  <View key={pos} style={{ width: '48%', marginBottom: 2 }}>
                    <AncestorBox 
                      dog={getAncestor(data, pos)} 
                      label=""
                      position={pos}
                      compact={true}
                    />
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
      
      {/* Footer */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: BRAND_COLORS.gray[200],
      }}>
        <Text style={{ fontSize: 7, color: BRAND_COLORS.gray[500] }}>
          S = Sire/Father, D = Dam/Mother
        </Text>
        <Text style={{ fontSize: 7, color: BRAND_COLORS.gray[500], letterSpacing: 1 }}>
          Generated by {(data.breederSettings.kennelName || 'RESPECTABULLZ').toUpperCase()}
        </Text>
      </View>
    </Page>
  );
}

// Helper to get generation 3 labels
function getGen3Label(position: string): string {
  const labels: Record<string, string> = {
    'SSS': 'P. GGF',
    'SSD': 'P. GGM',
    'SDS': 'P. GGF',
    'SDD': 'P. GGM',
    'DSS': 'M. GGF',
    'DSD': 'M. GGM',
    'DDS': 'M. GGF',
    'DDD': 'M. GGM',
  };
  return labels[position] || '';
}

