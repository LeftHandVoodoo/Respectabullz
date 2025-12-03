/**
 * PhotoGallerySection - Photo gallery with inline images
 * Displays dog photos and parent photos in a clean layout
 */
import { View, Text, Image } from '@react-pdf/renderer';
import { sharedStyles, BRAND_COLORS } from '@/lib/pdfExport';
import type { PacketData } from '@/types';

interface PhotoGallerySectionProps {
  data: PacketData;
  dogPhotosBase64: (string | null)[];
  sirePhotoBase64?: string | null;
  damPhotoBase64?: string | null;
  includeParentPhotos?: boolean;
}

export function PhotoGallerySection({ 
  data, 
  dogPhotosBase64,
  sirePhotoBase64,
  damPhotoBase64,
  includeParentPhotos = true,
}: PhotoGallerySectionProps) {
  const { dog, sire, dam, dogPhotos } = data;
  
  // Create mapping of photos with their metadata
  // dogPhotosBase64 array structure: [profilePhoto, ...galleryPhotos]
  // We need to match each base64 photo with its metadata from dogPhotos array
  const photosWithMetadata: Array<{ base64: string; info?: typeof dogPhotos[0] | null; isProfile: boolean }> = [];
  
  // Build a map of filePath -> photo info for quick lookup
  const photoInfoMap = new Map(dogPhotos.map(p => [p.filePath, p]));
  
  // Process each base64 photo
  let galleryPhotoIndex = 0;
  dogPhotosBase64.forEach((photoBase64, index) => {
    if (!photoBase64) return;
    
    // First photo is always the profile photo (if profile photo exists)
    if (index === 0 && dog.profilePhotoPath) {
      const profilePhotoInfo = photoInfoMap.get(dog.profilePhotoPath);
      photosWithMetadata.push({
        base64: photoBase64,
        info: profilePhotoInfo || null,
        isProfile: true,
      });
    } else {
      // Remaining photos are gallery photos
      // Find the next gallery photo (not the profile photo)
      const galleryPhotos = dogPhotos.filter(p => p.filePath !== dog.profilePhotoPath);
      const photoInfo = galleryPhotos[galleryPhotoIndex] || null;
      photosWithMetadata.push({
        base64: photoBase64,
        info: photoInfo,
        isProfile: false,
      });
      galleryPhotoIndex++;
    }
  });
  
  // Filter to only photos that have base64 data
  const availablePhotos = photosWithMetadata;
  
  if (availablePhotos.length === 0 && !sirePhotoBase64 && !damPhotoBase64) {
    return (
      <View style={sharedStyles.section}>
        <View style={sharedStyles.sectionHeader}>
          <Text style={sharedStyles.sectionTitle}>Photo Gallery</Text>
        </View>
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.body}>No photos available.</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={sharedStyles.section}>
      {/* Section Header */}
      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Photo Gallery</Text>
      </View>
      
      {/* Dog's Photos */}
      {availablePhotos.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={sharedStyles.h3}>{dog.name}'s Photos</Text>
          
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 8,
          }}>
            {availablePhotos.map((photo, index) => (
              <View key={index} style={{
                width: availablePhotos.length === 1 ? '100%' : 
                       availablePhotos.length === 2 ? '48%' : '31%',
              }}>
                <View style={{
                  ...sharedStyles.card,
                  padding: 8,
                  alignItems: 'center',
                }}>
                  <Image 
                    src={photo.base64} 
                    style={{
                      width: '100%',
                      height: availablePhotos.length === 1 ? 200 : 120,
                      objectFit: 'cover',
                      borderRadius: 4,
                    }} 
                  />
                  {photo.info?.caption && (
                    <Text style={{
                      ...sharedStyles.caption,
                      marginTop: 6,
                      textAlign: 'center',
                    }}>
                      {photo.info.caption}
                    </Text>
                  )}
                  {(photo.info?.isPrimary || photo.isProfile) && (
                    <View style={{
                      ...sharedStyles.badge,
                      backgroundColor: BRAND_COLORS.gold,
                      marginTop: 4,
                    }}>
                      <Text style={{ color: BRAND_COLORS.white, fontSize: 6 }}>
                        {photo.isProfile ? 'PROFILE' : 'PRIMARY'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Parent Photos */}
      {includeParentPhotos && (sirePhotoBase64 || damPhotoBase64) && (
        <View>
          <Text style={sharedStyles.h3}>Parents</Text>
          
          <View style={{
            flexDirection: 'row',
            gap: 15,
            marginTop: 8,
          }}>
            {/* Sire */}
            <View style={{ flex: 1 }}>
              <View style={{
                ...sharedStyles.card,
                padding: 10,
                alignItems: 'center',
                backgroundColor: '#e0f2fe',
                borderColor: '#0284c7',
              }}>
                {sirePhotoBase64 ? (
                  <Image 
                    src={sirePhotoBase64} 
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 50,
                      borderWidth: 3,
                      borderColor: '#0284c7',
                    }} 
                  />
                ) : (
                  <View style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: BRAND_COLORS.gray[200],
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 3,
                    borderColor: '#0284c7',
                  }}>
                    <Text style={{
                      fontSize: 28,
                      color: '#0284c7',
                      fontFamily: 'Helvetica',
                      fontWeight: 'bold',
                    }}>
                      {sire?.name?.substring(0, 2).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                
                <Text style={{
                  fontSize: 8,
                  color: BRAND_COLORS.gray[500],
                  textTransform: 'uppercase',
                  marginTop: 8,
                  marginBottom: 2,
                }}>
                  Sire (Father)
                </Text>
                
                <Text style={{
                  fontSize: 11,
                  fontFamily: 'Helvetica',
                  fontWeight: 'bold',
                  color: BRAND_COLORS.darkBrown,
                  textAlign: 'center',
                }}>
                  {sire?.name || 'Unknown'}
                </Text>
                
                {sire?.registrationNumber && (
                  <Text style={{
                    fontSize: 8,
                    fontFamily: 'Courier',
                    color: BRAND_COLORS.gray[500],
                    marginTop: 2,
                  }}>
                    {sire.registrationNumber}
                  </Text>
                )}
                
                {sire?.color && (
                  <Text style={{
                    fontSize: 8,
                    color: BRAND_COLORS.gray[500],
                  }}>
                    {sire.color}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Dam */}
            <View style={{ flex: 1 }}>
              <View style={{
                ...sharedStyles.card,
                padding: 10,
                alignItems: 'center',
                backgroundColor: '#fce7f3',
                borderColor: '#db2777',
              }}>
                {damPhotoBase64 ? (
                  <Image 
                    src={damPhotoBase64} 
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 50,
                      borderWidth: 3,
                      borderColor: '#db2777',
                    }} 
                  />
                ) : (
                  <View style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: BRAND_COLORS.gray[200],
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 3,
                    borderColor: '#db2777',
                  }}>
                    <Text style={{
                      fontSize: 28,
                      color: '#db2777',
                      fontFamily: 'Helvetica',
                      fontWeight: 'bold',
                    }}>
                      {dam?.name?.substring(0, 2).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                
                <Text style={{
                  fontSize: 8,
                  color: BRAND_COLORS.gray[500],
                  textTransform: 'uppercase',
                  marginTop: 8,
                  marginBottom: 2,
                }}>
                  Dam (Mother)
                </Text>
                
                <Text style={{
                  fontSize: 11,
                  fontFamily: 'Helvetica',
                  fontWeight: 'bold',
                  color: BRAND_COLORS.darkBrown,
                  textAlign: 'center',
                }}>
                  {dam?.name || 'Unknown'}
                </Text>
                
                {dam?.registrationNumber && (
                  <Text style={{
                    fontSize: 8,
                    fontFamily: 'Courier',
                    color: BRAND_COLORS.gray[500],
                    marginTop: 2,
                  }}>
                    {dam.registrationNumber}
                  </Text>
                )}
                
                {dam?.color && (
                  <Text style={{
                    fontSize: 8,
                    color: BRAND_COLORS.gray[500],
                  }}>
                    {dam.color}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Photo note */}
      <View style={{
        marginTop: 15,
        padding: 10,
        backgroundColor: BRAND_COLORS.gray[100],
        borderRadius: 4,
      }}>
        <Text style={{ fontSize: 8, color: BRAND_COLORS.gray[500], fontStyle: 'normal' }}>
          Photos represent {dog.name} as of the date this packet was generated. 
          Appearance may change as the dog matures.
        </Text>
      </View>
    </View>
  );
}

