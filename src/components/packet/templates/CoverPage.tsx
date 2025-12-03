/**
 * CoverPage - Premium cover page for customer packet PDF
 * Features full branding, dog photo, and key information
 */
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { sharedStyles, BRAND_COLORS, formatDate, formatSex, calculateAge } from '@/lib/pdfExport';
import type { PacketData } from '@/types';

interface CoverPageProps {
  data: PacketData;
  dogPhotoBase64?: string | null;
  logoBase64?: string | null;
}

export function CoverPage({ data, dogPhotoBase64, logoBase64 }: CoverPageProps) {
  const { dog, breederSettings } = data;
  
  return (
    <Page size="LETTER" style={sharedStyles.coverPage}>
      {/* Top decoration bar */}
      <View style={sharedStyles.coverDecoration} />
      
      {/* Main content */}
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        {/* Kennel logo */}
        {logoBase64 && (
          <Image src={logoBase64} style={sharedStyles.coverLogo} />
        )}
        
        {/* Kennel name - styled to match app branding */}
        <Text style={{
          ...sharedStyles.brandTextLarge,
          marginBottom: 8,
        }}>
          {breederSettings.kennelName || 'RESPECTABULLZ'}
        </Text>
        
        <Text style={{
          fontSize: 14,
          fontFamily: 'Helvetica',
          color: BRAND_COLORS.gray[500],
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}>
          CUSTOMER PACKET
        </Text>
        
        {/* Decorative line */}
        <View style={{
          width: 100,
          height: 2,
          backgroundColor: BRAND_COLORS.gold,
          marginVertical: 20,
        }} />
        
        {/* Dog photo */}
        {dogPhotoBase64 ? (
          <Image src={dogPhotoBase64} style={sharedStyles.coverDogPhoto} />
        ) : (
          <View style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: BRAND_COLORS.gray[200],
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: BRAND_COLORS.brown,
          }}>
            <Text style={{
              fontSize: 48,
              color: BRAND_COLORS.brown,
              fontFamily: 'Helvetica',
              fontWeight: 'bold',
            }}>
              {dog.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        
        {/* Dog name */}
        <Text style={sharedStyles.coverDogName}>
          {dog.name}
        </Text>
        
        {/* Dog info */}
        <View style={sharedStyles.coverInfo}>
          <Text style={sharedStyles.coverInfoText}>
            {dog.breed}
          </Text>
          <Text style={sharedStyles.coverInfoText}>
            {formatSex(dog.sex)} • {dog.color || 'Unknown color'}
          </Text>
          {dog.dateOfBirth && (
            <Text style={sharedStyles.coverInfoText}>
              Born: {formatDate(dog.dateOfBirth)} ({calculateAge(dog.dateOfBirth)} old)
            </Text>
          )}
          {dog.registrationNumber && (
            <Text style={{
              fontSize: 11,
              color: BRAND_COLORS.brown,
              fontFamily: 'Helvetica',
              fontWeight: 'bold',
              marginTop: 8,
            }}>
              Reg: {dog.registrationNumber}
            </Text>
          )}
        </View>
      </View>
      
      {/* Footer with breeder contact */}
      <View style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
      }}>
        <View style={{
          width: 60,
          height: 1,
          backgroundColor: BRAND_COLORS.brown,
          marginBottom: 15,
        }} />
        
        {breederSettings.breederName && (
          <Text style={{
            fontSize: 10,
            color: BRAND_COLORS.gray[600],
            marginBottom: 4,
          }}>
            {breederSettings.breederName}
          </Text>
        )}
        
        {breederSettings.phone && (
          <Text style={{
            fontSize: 9,
            color: BRAND_COLORS.gray[500],
            marginBottom: 2,
          }}>
            {breederSettings.phone}
          </Text>
        )}
        
        {breederSettings.email && (
          <Text style={{
            fontSize: 9,
            color: BRAND_COLORS.gray[500],
          }}>
            {breederSettings.email}
          </Text>
        )}
        
        {/* Prepared date */}
        <Text style={{
          fontSize: 8,
          color: BRAND_COLORS.gray[400],
          marginTop: 15,
        }}>
          Prepared: {formatDate(new Date())}
        </Text>
      </View>
      
      {/* Bottom decoration bar */}
      <View style={sharedStyles.coverDecorationBottom} />
    </Page>
  );
}

