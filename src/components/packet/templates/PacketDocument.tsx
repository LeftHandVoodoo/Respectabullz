/**
 * PacketDocument - Main PDF document that assembles all sections
 * Handles page layout, headers, footers, and section rendering
 */
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { sharedStyles, BRAND_COLORS, formatDate } from '@/lib/pdfExport';
import { CoverPage } from './CoverPage';
import { DogInfoSection } from './DogInfoSection';
import { PedigreeSection } from './PedigreeSection';
import { HealthSection } from './HealthSection';
import { WeightChartSection } from './WeightChartSection';
import { FinancialSection } from './FinancialSection';
import { CareInstructionsSection } from './CareInstructionsSection';
import { PhotoGallerySection } from './PhotoGallerySection';
import type { PacketData, PacketOptions } from '@/types';

interface PacketDocumentProps {
  data: PacketData;
  options: PacketOptions;
  // Base64 encoded images
  dogPhotoBase64?: string | null;
  logoBase64?: string | null;
  dogGalleryPhotosBase64?: (string | null)[];
  sirePhotoBase64?: string | null;
  damPhotoBase64?: string | null;
}

// Header component for content pages
function PageHeader({ data, logoBase64 }: { data: PacketData; logoBase64?: string | null }) {
  return (
    <View style={sharedStyles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {logoBase64 && (
          <Image src={logoBase64} style={{ ...sharedStyles.headerLogo, marginRight: 8 }} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 11,
            fontFamily: 'Helvetica-Bold',
            color: BRAND_COLORS.brown,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}>
            {data.breederSettings.kennelName || 'RESPECTABULLZ'}
          </Text>
          <Text style={sharedStyles.headerContact}>
            {[
              data.breederSettings.phone,
              data.breederSettings.email,
            ].filter(Boolean).join(' • ')}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
        <Text style={{
          fontSize: 10,
          fontFamily: 'Helvetica-Bold',
          color: BRAND_COLORS.brown,
        }}>
          {data.dog.name}
        </Text>
        {data.dog.registrationNumber && (
          <Text style={{
            fontSize: 8,
            fontFamily: 'Courier',
            color: BRAND_COLORS.gray[500],
          }}>
            {data.dog.registrationNumber}
          </Text>
        )}
      </View>
    </View>
  );
}

// Footer component for all pages
function PageFooter({ data }: { data: PacketData; pageNumber?: number }) {
  return (
    <View style={sharedStyles.footer} fixed>
      <Text style={{
        ...sharedStyles.footerText,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}>
        {data.breederSettings.kennelName || 'RESPECTABULLZ'} • Customer Packet
      </Text>
      <Text style={sharedStyles.footerText}>
        Generated: {formatDate(new Date())}
      </Text>
      <Text 
        style={sharedStyles.pageNumber} 
        render={({ pageNumber: pn, totalPages }) => `Page ${pn} of ${totalPages}`}
      />
    </View>
  );
}

export function PacketDocument({
  data,
  options,
  dogPhotoBase64,
  logoBase64,
  dogGalleryPhotosBase64 = [],
  sirePhotoBase64,
  damPhotoBase64,
}: PacketDocumentProps) {
  return (
    <Document
      title={`Customer Packet - ${data.dog.name}`}
      author={data.breederSettings.kennelName || 'Respectabullz'}
      subject={`Customer packet for ${data.dog.name}`}
      creator="Respectabullz Dog Breeder Management"
    >
      {/* Cover Page - Always included */}
      <CoverPage 
        data={data} 
        dogPhotoBase64={dogPhotoBase64}
        logoBase64={logoBase64}
      />
      
      {/* Dog Information Page */}
      {options.includeDogInfo && (
        <Page size="LETTER" style={sharedStyles.page}>
          <PageHeader data={data} logoBase64={logoBase64} />
          <DogInfoSection 
            data={data} 
            dogPhotoBase64={dogPhotoBase64}
          />
          <PageFooter data={data} />
        </Page>
      )}
      
      {/* Pedigree - Landscape page */}
      {options.includePedigree && (
        <PedigreeSection 
          data={data} 
          generations={options.pedigreeGenerations}
        />
      )}
      
      {/* Photos Page */}
      {options.includePhotos && (
        <Page size="LETTER" style={sharedStyles.page}>
          <PageHeader data={data} logoBase64={logoBase64} />
          <PhotoGallerySection 
            data={data}
            dogPhotosBase64={dogGalleryPhotosBase64}
            sirePhotoBase64={options.includeParentPhotos ? sirePhotoBase64 : null}
            damPhotoBase64={options.includeParentPhotos ? damPhotoBase64 : null}
            includeParentPhotos={options.includeParentPhotos}
          />
          <PageFooter data={data} />
        </Page>
      )}
      
      {/* Health Records Page */}
      {(options.includeVaccinations || options.includeMedicalRecords || options.includeGeneticTests) && (
        <Page size="LETTER" style={sharedStyles.page}>
          <PageHeader data={data} logoBase64={logoBase64} />
          <HealthSection 
            data={data}
            includeVaccinations={options.includeVaccinations}
            includeMedicalRecords={options.includeMedicalRecords}
            includeGeneticTests={options.includeGeneticTests}
          />
          <PageFooter data={data} />
        </Page>
      )}
      
      {/* Weight Chart Page */}
      {options.includeWeightChart && data.weightEntries.length > 0 && (
        <Page size="LETTER" style={sharedStyles.page}>
          <PageHeader data={data} logoBase64={logoBase64} />
          <WeightChartSection data={data} />
          <PageFooter data={data} />
        </Page>
      )}
      
      {/* Financial Page */}
      {options.includeFinancial && (
        <Page size="LETTER" style={sharedStyles.page}>
          <PageHeader data={data} logoBase64={logoBase64} />
          <FinancialSection data={data} />
          <PageFooter data={data} />
        </Page>
      )}
      
      {/* Care Instructions Page */}
      {options.includeCareInstructions && (
        <Page size="LETTER" style={sharedStyles.page}>
          <PageHeader data={data} logoBase64={logoBase64} />
          <CareInstructionsSection data={data} />
          <PageFooter data={data} />
        </Page>
      )}
      
      {/* Thank You / Final Page */}
      <Page size="LETTER" style={{
        ...sharedStyles.page,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          alignItems: 'center',
          maxWidth: 400,
        }}>
          {/* Logo */}
          {logoBase64 && (
            <Image src={logoBase64} style={sharedStyles.thankYouLogo} />
          )}
          
          {/* Decorative element */}
          <View style={{
            width: 60,
            height: 2,
            backgroundColor: BRAND_COLORS.brown,
            marginBottom: 30,
          }} />
          
          <Text style={{
            fontSize: 24,
            fontFamily: 'Helvetica-Bold',
            color: BRAND_COLORS.brown,
            textAlign: 'center',
            marginBottom: 15,
          }}>
            Thank You
          </Text>
          
          <Text style={{
            fontSize: 12,
            color: BRAND_COLORS.gray[600],
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: 30,
          }}>
            Thank you for choosing {data.breederSettings.kennelName || 'us'} for your new family member.
            We are confident that {data.dog.name} will bring you years of joy and companionship.
          </Text>
          
          <Text style={{
            fontSize: 10,
            color: BRAND_COLORS.gray[500],
            textAlign: 'center',
            marginBottom: 40,
          }}>
            Please don't hesitate to reach out if you have any questions or 
            if there's anything we can do to help you and {data.dog.name} settle in.
          </Text>
          
          {/* Contact info */}
          <View style={{
            backgroundColor: BRAND_COLORS.cream,
            padding: 20,
            borderRadius: 8,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: BRAND_COLORS.gray[200],
          }}>
            <Text style={{
              ...sharedStyles.brandTextSmall,
              fontSize: 16,
              marginBottom: 10,
            }}>
              {data.breederSettings.kennelName || 'RESPECTABULLZ'}
            </Text>
            
            {data.breederSettings.breederName && (
              <Text style={{
                fontSize: 10,
                color: BRAND_COLORS.gray[700],
                marginBottom: 4,
              }}>
                {data.breederSettings.breederName}
              </Text>
            )}
            
            {data.breederSettings.phone && (
              <Text style={{
                fontSize: 10,
                color: BRAND_COLORS.gray[600],
                marginBottom: 2,
              }}>
                Phone: {data.breederSettings.phone}
              </Text>
            )}
            
            {data.breederSettings.email && (
              <Text style={{
                fontSize: 10,
                color: BRAND_COLORS.gray[600],
                marginBottom: 2,
              }}>
                Email: {data.breederSettings.email}
              </Text>
            )}
            
            {(data.breederSettings.city || data.breederSettings.state) && (
              <Text style={{
                fontSize: 10,
                color: BRAND_COLORS.gray[600],
              }}>
                Location: {[data.breederSettings.city, data.breederSettings.state].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
          
          {/* Decorative element */}
          <View style={{
            width: 60,
            height: 2,
            backgroundColor: BRAND_COLORS.brown,
            marginTop: 40,
          }} />
        </View>
        
        <PageFooter data={data} />
      </Page>
    </Document>
  );
}

