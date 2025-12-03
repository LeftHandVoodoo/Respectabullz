/**
 * DogInfoSection - Comprehensive dog information section for customer packet
 * Includes all dog details, registration info, and temperament notes
 */
import { View, Text, Image } from '@react-pdf/renderer';
import { sharedStyles, BRAND_COLORS, formatDate, formatSex, calculateAge } from '@/lib/pdfExport';
import type { PacketData } from '@/types';

interface DogInfoSectionProps {
  data: PacketData;
  dogPhotoBase64?: string | null;
}

export function DogInfoSection({ data, dogPhotoBase64 }: DogInfoSectionProps) {
  const { dog, sire, dam } = data;
  
  return (
    <View style={sharedStyles.section}>
      {/* Section Header */}
      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Dog Information</Text>
      </View>
      
      {/* Main info card with photo */}
      <View style={{
        ...sharedStyles.card,
        flexDirection: 'row',
        padding: 15,
      }}>
        {/* Photo */}
        {dogPhotoBase64 ? (
          <Image src={dogPhotoBase64} style={{
            width: 100,
            height: 100,
            borderRadius: 8,
            objectFit: 'cover',
            marginRight: 20,
            borderWidth: 2,
            borderColor: BRAND_COLORS.brown,
          }} />
        ) : (
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 8,
            backgroundColor: BRAND_COLORS.gray[200],
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 20,
            borderWidth: 2,
            borderColor: BRAND_COLORS.brown,
          }}>
            <Text style={{
              fontSize: 28,
              color: BRAND_COLORS.brown,
              fontFamily: 'Helvetica',
              fontWeight: 'bold',
            }}>
              {dog.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Basic info */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: BRAND_COLORS.brown,
            fontFamily: 'Helvetica-Bold',
            marginBottom: 8,
          }}>
            {dog.name}
          </Text>
          
          <View style={sharedStyles.row}>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>BREED</Text>
              <Text style={sharedStyles.value}>{dog.breed}</Text>
            </View>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>SEX</Text>
              <Text style={sharedStyles.value}>{formatSex(dog.sex)}</Text>
            </View>
          </View>
          
          <View style={{ ...sharedStyles.row, marginTop: 6 }}>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>COLOR</Text>
              <Text style={sharedStyles.value}>{dog.color || 'Not specified'}</Text>
            </View>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>STATUS</Text>
              <Text style={sharedStyles.value}>{dog.status.charAt(0).toUpperCase() + dog.status.slice(1)}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Birth Information Card */}
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Birth Information</Text>
        <View style={sharedStyles.row}>
          <View style={sharedStyles.col3}>
            <Text style={sharedStyles.label}>DATE OF BIRTH</Text>
            <Text style={sharedStyles.value}>
              {dog.dateOfBirth ? formatDate(dog.dateOfBirth) : 'Not recorded'}
            </Text>
          </View>
          <View style={sharedStyles.col3}>
            <Text style={sharedStyles.label}>AGE</Text>
            <Text style={sharedStyles.value}>
              {dog.dateOfBirth ? calculateAge(dog.dateOfBirth) : 'Unknown'}
            </Text>
          </View>
          <View style={sharedStyles.col3}>
            <Text style={sharedStyles.label}>MICROCHIP</Text>
            <Text style={sharedStyles.value}>
              {dog.microchipNumber || 'Not microchipped'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Registration Information Card */}
      {(dog.registrationNumber || dog.registryName || dog.registrationType) && (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Registration Information</Text>
          <View style={sharedStyles.row}>
            {dog.registrationNumber && (
              <View style={sharedStyles.col3}>
                <Text style={sharedStyles.label}>REGISTRATION NUMBER</Text>
                <Text style={{
                  ...sharedStyles.value,
                  fontFamily: 'Courier',
                  fontSize: 10,
                }}>
                  {dog.registrationNumber}
                </Text>
              </View>
            )}
            {dog.registryName && (
              <View style={sharedStyles.col3}>
                <Text style={sharedStyles.label}>REGISTRY</Text>
                <Text style={sharedStyles.value}>{dog.registryName}</Text>
              </View>
            )}
            {dog.registrationType && (
              <View style={sharedStyles.col3}>
                <Text style={sharedStyles.label}>REGISTRATION TYPE</Text>
                <Text style={sharedStyles.value}>
                  {dog.registrationType === 'full' ? 'Full Registration' : 'Limited Registration'}
                </Text>
              </View>
            )}
          </View>
          {dog.registrationStatus && (
            <View style={{ marginTop: 6 }}>
              <Text style={sharedStyles.label}>STATUS</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 2,
              }}>
                <View style={{
                  ...sharedStyles.badge,
                  backgroundColor: dog.registrationStatus === 'registered' 
                    ? '#22c55e' 
                    : dog.registrationStatus === 'pending' 
                      ? '#f59e0b' 
                      : BRAND_COLORS.gray[500],
                }}>
                  <Text style={{ color: BRAND_COLORS.white, fontSize: 8 }}>
                    {dog.registrationStatus.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
      
      {/* Parents Information Card */}
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.cardTitle}>Parents</Text>
        <View style={sharedStyles.row}>
          <View style={sharedStyles.col2}>
            <Text style={sharedStyles.label}>SIRE (FATHER)</Text>
            {sire ? (
              <View>
                <Text style={sharedStyles.value}>{sire.name}</Text>
                {sire.registrationNumber && (
                  <Text style={{
                    ...sharedStyles.bodySmall,
                    fontFamily: 'Courier',
                    marginTop: 2,
                  }}>
                    {sire.registrationNumber}
                  </Text>
                )}
                {sire.color && (
                  <Text style={sharedStyles.bodySmall}>{sire.color}</Text>
                )}
              </View>
            ) : (
              <Text style={sharedStyles.value}>Unknown</Text>
            )}
          </View>
          <View style={sharedStyles.col2}>
            <Text style={sharedStyles.label}>DAM (MOTHER)</Text>
            {dam ? (
              <View>
                <Text style={sharedStyles.value}>{dam.name}</Text>
                {dam.registrationNumber && (
                  <Text style={{
                    ...sharedStyles.bodySmall,
                    fontFamily: 'Courier',
                    marginTop: 2,
                  }}>
                    {dam.registrationNumber}
                  </Text>
                )}
                {dam.color && (
                  <Text style={sharedStyles.bodySmall}>{dam.color}</Text>
                )}
              </View>
            ) : (
              <Text style={sharedStyles.value}>Unknown</Text>
            )}
          </View>
        </View>
      </View>
      
      {/* Evaluation & Temperament Card */}
      {(dog.evaluationCategory || dog.temperamentNotes || dog.structureNotes) && (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Evaluation & Temperament</Text>
          
          {dog.evaluationCategory && (
            <View style={{ marginBottom: 8 }}>
              <Text style={sharedStyles.label}>EVALUATION CATEGORY</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 2,
              }}>
                <View style={{
                  ...sharedStyles.badge,
                  backgroundColor: dog.evaluationCategory === 'show_prospect' 
                    ? BRAND_COLORS.gold 
                    : dog.evaluationCategory === 'breeding_prospect' 
                      ? BRAND_COLORS.brown 
                      : BRAND_COLORS.gray[500],
                }}>
                  <Text style={{ color: BRAND_COLORS.white, fontSize: 8 }}>
                    {dog.evaluationCategory === 'show_prospect' 
                      ? 'SHOW PROSPECT' 
                      : dog.evaluationCategory === 'breeding_prospect' 
                        ? 'BREEDING PROSPECT' 
                        : 'PET'}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {dog.temperamentNotes && (
            <View style={{ marginBottom: 8 }}>
              <Text style={sharedStyles.label}>TEMPERAMENT</Text>
              <Text style={{ ...sharedStyles.body, marginTop: 2 }}>
                {dog.temperamentNotes}
              </Text>
            </View>
          )}
          
          {dog.structureNotes && (
            <View>
              <Text style={sharedStyles.label}>STRUCTURE NOTES</Text>
              <Text style={{ ...sharedStyles.body, marginTop: 2 }}>
                {dog.structureNotes}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Notes Card */}
      {dog.notes && (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.cardTitle}>Additional Notes</Text>
          <Text style={sharedStyles.body}>{dog.notes}</Text>
        </View>
      )}
    </View>
  );
}

