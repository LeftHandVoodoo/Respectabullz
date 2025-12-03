/**
 * HealthSection - Health records displayed as premium cards
 * Includes vaccinations, medical records, and genetic tests
 */
import { View, Text } from '@react-pdf/renderer';
import { sharedStyles, BRAND_COLORS, formatDate, getGeneticTestResultColor } from '@/lib/pdfExport';
import type { PacketData } from '@/types';

interface HealthSectionProps {
  data: PacketData;
  includeVaccinations?: boolean;
  includeMedicalRecords?: boolean;
  includeGeneticTests?: boolean;
}

export function HealthSection({ 
  data, 
  includeVaccinations = true,
  includeMedicalRecords = true,
  includeGeneticTests = true,
}: HealthSectionProps) {
  const { vaccinations, medicalRecords, geneticTests } = data;
  
  // Sort by date descending
  const sortedVaccinations = [...vaccinations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const sortedMedicalRecords = [...medicalRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const sortedGeneticTests = [...geneticTests].sort(
    (a, b) => (a.testName || '').localeCompare(b.testName || '')
  );
  
  return (
    <View style={sharedStyles.section}>
      {/* Section Header */}
      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Health Records</Text>
      </View>
      
      {/* Vaccinations */}
      {includeVaccinations && (
        <View style={{ marginBottom: 20 }}>
          <Text style={sharedStyles.h3}>Vaccination History</Text>
          
          {sortedVaccinations.length === 0 ? (
            <View style={sharedStyles.card}>
              <Text style={sharedStyles.body}>No vaccination records on file.</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {sortedVaccinations.map((vax) => (
                <View key={vax.id} style={{
                  ...sharedStyles.card,
                  width: '48%',
                  marginBottom: 0,
                }}>
                  {/* Vaccine type badge */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 6,
                  }}>
                    <View style={{
                      ...sharedStyles.badge,
                      backgroundColor: BRAND_COLORS.brown,
                    }}>
                      <Text style={{ color: BRAND_COLORS.white, fontSize: 7 }}>
                        {vax.vaccineType.toUpperCase()}
                      </Text>
                    </View>
                    {vax.nextDueDate && (
                      <Text style={{
                        fontSize: 7,
                        color: BRAND_COLORS.gray[500],
                      }}>
                        Next: {formatDate(vax.nextDueDate)}
                      </Text>
                    )}
                  </View>
                  
                  {/* Date */}
                  <View style={sharedStyles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={sharedStyles.label}>DATE GIVEN</Text>
                      <Text style={sharedStyles.value}>{formatDate(vax.date)}</Text>
                    </View>
                  </View>
                  
                  {/* Details */}
                  {(vax.vetClinic || vax.dose || vax.lotNumber) && (
                    <View style={{ marginTop: 6 }}>
                      {vax.vetClinic && (
                        <Text style={sharedStyles.bodySmall}>Clinic: {vax.vetClinic}</Text>
                      )}
                      {vax.dose && (
                        <Text style={sharedStyles.bodySmall}>Dose: {vax.dose}</Text>
                      )}
                      {vax.lotNumber && (
                        <Text style={sharedStyles.bodySmall}>Lot #: {vax.lotNumber}</Text>
                      )}
                    </View>
                  )}
                  
                  {/* Notes */}
                  {vax.notes && (
                    <Text style={{
                      ...sharedStyles.caption,
                      marginTop: 4,
                    }}>
                      {vax.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* Medical Records */}
      {includeMedicalRecords && (
        <View style={{ marginBottom: 20 }}>
          <Text style={sharedStyles.h3}>Medical Records</Text>
          
          {sortedMedicalRecords.length === 0 ? (
            <View style={sharedStyles.card}>
              <Text style={sharedStyles.body}>No medical records on file.</Text>
            </View>
          ) : (
            <View>
              {sortedMedicalRecords.map((record) => (
                <View key={record.id} style={sharedStyles.card}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 6,
                  }}>
                    {/* Type badge */}
                    <View style={{
                      ...sharedStyles.badgeOutline,
                      borderColor: getRecordTypeColor(record.type),
                      backgroundColor: getRecordTypeColor(record.type) + '15',
                    }}>
                      <Text style={{ 
                        color: getRecordTypeColor(record.type), 
                        fontSize: 7,
                        fontFamily: 'Helvetica',
                        fontWeight: 'bold',
                      }}>
                        {record.type.toUpperCase()}
                      </Text>
                    </View>
                    
                    {/* Date */}
                    <Text style={{
                      fontSize: 9,
                      color: BRAND_COLORS.gray[600],
                    }}>
                      {formatDate(record.date)}
                    </Text>
                  </View>
                  
                  {/* Description */}
                  <Text style={{
                    ...sharedStyles.body,
                    fontFamily: 'Helvetica',
                    fontWeight: 'bold',
                    marginBottom: 4,
                  }}>
                    {record.description}
                  </Text>
                  
                  {/* Vet clinic */}
                  {record.vetClinic && (
                    <Text style={sharedStyles.bodySmall}>
                      Clinic: {record.vetClinic}
                    </Text>
                  )}
                  
                  {/* Notes */}
                  {record.notes && (
                    <Text style={{
                      ...sharedStyles.caption,
                      marginTop: 4,
                    }}>
                      {record.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* Genetic Tests */}
      {includeGeneticTests && (
        <View>
          <Text style={sharedStyles.h3}>Genetic Testing</Text>
          
          {sortedGeneticTests.length === 0 ? (
            <View style={sharedStyles.card}>
              <Text style={sharedStyles.body}>No genetic tests on file.</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {sortedGeneticTests.map((test) => (
                <View key={test.id} style={{
                  ...sharedStyles.card,
                  width: '31%',
                  marginBottom: 0,
                  alignItems: 'center',
                  padding: 10,
                }}>
                  {/* Test name */}
                  <Text style={{
                    fontSize: 10,
                    fontFamily: 'Helvetica',
                    fontWeight: 'bold',
                    color: BRAND_COLORS.brown,
                    textAlign: 'center',
                    marginBottom: 6,
                  }}>
                    {test.testName}
                  </Text>
                  
                  {/* Result badge */}
                  <View style={{
                    backgroundColor: getGeneticTestResultColor(test.result),
                    paddingVertical: 4,
                    paddingHorizontal: 12,
                    borderRadius: 4,
                    marginBottom: 6,
                  }}>
                    <Text style={{
                      color: BRAND_COLORS.white,
                      fontSize: 9,
                      fontFamily: 'Helvetica',
                    fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}>
                      {test.result}
                    </Text>
                  </View>
                  
                  {/* Test details */}
                  {test.testDate && (
                    <Text style={{
                      fontSize: 7,
                      color: BRAND_COLORS.gray[500],
                    }}>
                      Tested: {formatDate(test.testDate)}
                    </Text>
                  )}
                  
                  {test.labName && (
                    <Text style={{
                      fontSize: 7,
                      color: BRAND_COLORS.gray[500],
                    }}>
                      Lab: {test.labName}
                    </Text>
                  )}
                  
                  {test.certificateNumber && (
                    <Text style={{
                      fontSize: 6,
                      fontFamily: 'Courier',
                      color: BRAND_COLORS.gray[500],
                      marginTop: 2,
                    }}>
                      Cert: {test.certificateNumber}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
          
          {/* Genetic test summary */}
          {sortedGeneticTests.length > 0 && (
            <View style={{
              marginTop: 12,
              padding: 10,
              backgroundColor: BRAND_COLORS.cream,
              borderLeftWidth: 3,
              borderLeftColor: BRAND_COLORS.brown,
            }}>
              <Text style={{
                fontSize: 9,
                fontFamily: 'Helvetica-Bold',
                color: BRAND_COLORS.brown,
                marginBottom: 4,
              }}>
                Summary
              </Text>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <View>
                  <Text style={{ fontSize: 8, color: BRAND_COLORS.gray[600] }}>
                    Clear: {sortedGeneticTests.filter(t => t.result === 'clear').length}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 8, color: BRAND_COLORS.gray[600] }}>
                    Carrier: {sortedGeneticTests.filter(t => t.result === 'carrier').length}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 8, color: BRAND_COLORS.gray[600] }}>
                    Affected: {sortedGeneticTests.filter(t => t.result === 'affected').length}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 8, color: BRAND_COLORS.gray[600] }}>
                    Pending: {sortedGeneticTests.filter(t => t.result === 'pending').length}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Helper function to get color for medical record type
function getRecordTypeColor(type: string): string {
  switch (type) {
    case 'exam':
      return '#3b82f6'; // blue
    case 'surgery':
      return '#ef4444'; // red
    case 'test':
      return '#8b5cf6'; // purple
    case 'medication':
      return '#22c55e'; // green
    case 'injury':
      return '#f59e0b'; // amber
    default:
      return BRAND_COLORS.gray[500];
  }
}

