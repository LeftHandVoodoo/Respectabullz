/**
 * CareInstructionsSection - Comprehensive care guide for new owners
 * Includes feeding, grooming, training tips, and vet recommendations
 */
import { View, Text } from '@react-pdf/renderer';
import { sharedStyles, BRAND_COLORS } from '@/lib/pdfExport';
import type { PacketData } from '@/types';

interface CareInstructionsSectionProps {
  data: PacketData;
}

export function CareInstructionsSection({ data }: CareInstructionsSectionProps) {
  const { dog, breederSettings } = data;
  
  return (
    <View style={sharedStyles.section}>
      {/* Section Header */}
      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>New Owner Care Guide</Text>
      </View>
      
      {/* Welcome note */}
      <View style={{
        ...sharedStyles.card,
        backgroundColor: BRAND_COLORS.cream,
        borderLeftWidth: 4,
        borderLeftColor: BRAND_COLORS.brown,
        marginBottom: 15,
      }}>
        <Text style={{
          fontSize: 11,
          fontFamily: 'Helvetica',
          fontWeight: 'bold',
          color: BRAND_COLORS.brown,
          marginBottom: 6,
        }}>
          Congratulations on your new family member!
        </Text>
        <Text style={sharedStyles.body}>
          Thank you for choosing {breederSettings.kennelName || 'us'} for your new companion. 
          This guide will help you provide the best care for {dog.name}. 
          Please don't hesitate to reach out if you have any questions.
        </Text>
      </View>
      
      {/* Feeding Guidelines */}
      <View style={sharedStyles.card}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: BRAND_COLORS.brown,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}>
            <Text style={{ color: BRAND_COLORS.white, fontSize: 12, fontFamily: 'Helvetica-Bold' }}>F</Text>
          </View>
          <Text style={sharedStyles.cardTitle}>Feeding Guidelines</Text>
        </View>
        
        <View style={{ marginBottom: 10 }}>
          <Text style={{ ...sharedStyles.h3, marginBottom: 4 }}>Recommended Diet</Text>
          <Text style={sharedStyles.body}>
            Feed a high-quality, age-appropriate dog food. We recommend premium brands that list meat 
            as the first ingredient. Avoid foods with corn, wheat, or soy as primary ingredients.
          </Text>
        </View>
        
        <View style={{ marginBottom: 10 }}>
          <Text style={{ ...sharedStyles.h3, marginBottom: 4 }}>Feeding Schedule</Text>
          <View style={sharedStyles.row}>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>PUPPIES (8-12 WEEKS)</Text>
              <Text style={sharedStyles.body}>3-4 meals per day</Text>
            </View>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>PUPPIES (3-6 MONTHS)</Text>
              <Text style={sharedStyles.body}>3 meals per day</Text>
            </View>
          </View>
          <View style={{ ...sharedStyles.row, marginTop: 6 }}>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>PUPPIES (6-12 MONTHS)</Text>
              <Text style={sharedStyles.body}>2 meals per day</Text>
            </View>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>ADULTS (1+ YEARS)</Text>
              <Text style={sharedStyles.body}>1-2 meals per day</Text>
            </View>
          </View>
        </View>
        
        <View style={{
          backgroundColor: BRAND_COLORS.gray[100],
          padding: 8,
          borderRadius: 4,
        }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND_COLORS.gray[700], marginBottom: 2 }}>
            ! Important
          </Text>
          <Text style={{ fontSize: 8, color: BRAND_COLORS.gray[600] }}>
            Always provide fresh, clean water. Avoid sudden food changes - transition slowly over 7-10 days 
            if switching brands. Never feed chocolate, grapes, raisins, onions, or xylitol-containing products.
          </Text>
        </View>
      </View>
      
      {/* Grooming */}
      <View style={sharedStyles.card}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: BRAND_COLORS.brown,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}>
            <Text style={{ color: BRAND_COLORS.white, fontSize: 12, fontFamily: 'Helvetica-Bold' }}>G</Text>
          </View>
          <Text style={sharedStyles.cardTitle}>Grooming</Text>
        </View>
        
        <View style={{ marginBottom: 8 }}>
          <Text style={sharedStyles.body}>
            Regular grooming is essential for your dog's health and comfort. Here's a recommended schedule:
          </Text>
        </View>
        
        <View style={sharedStyles.table}>
          <View style={sharedStyles.tableHeader}>
            <Text style={{ ...sharedStyles.tableHeaderCell, width: '35%' }}>Task</Text>
            <Text style={{ ...sharedStyles.tableHeaderCell, width: '25%' }}>Frequency</Text>
            <Text style={{ ...sharedStyles.tableHeaderCell, width: '40%' }}>Notes</Text>
          </View>
          
          {[
            { task: 'Brushing', freq: 'Weekly', notes: '2-3x/week during shedding season' },
            { task: 'Bathing', freq: 'Monthly', notes: 'Or as needed; avoid over-bathing' },
            { task: 'Nail Trimming', freq: 'Every 2-4 weeks', notes: 'Keep nails short to prevent issues' },
            { task: 'Ear Cleaning', freq: 'Weekly', notes: 'Check for redness or odor' },
            { task: 'Teeth Brushing', freq: 'Daily', notes: 'Use dog-specific toothpaste' },
            { task: 'Eye Cleaning', freq: 'As needed', notes: 'Wipe away discharge gently' },
          ].map((item, index) => (
            <View 
              key={item.task} 
              style={index % 2 === 0 ? sharedStyles.tableRow : sharedStyles.tableRowAlt}
            >
              <Text style={{ ...sharedStyles.tableCell, width: '35%', fontFamily: 'Helvetica', fontWeight: 'bold' }}>
                {item.task}
              </Text>
              <Text style={{ ...sharedStyles.tableCell, width: '25%' }}>
                {item.freq}
              </Text>
              <Text style={{ ...sharedStyles.tableCell, width: '40%' }}>
                {item.notes}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Exercise & Training */}
      <View style={sharedStyles.card}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: BRAND_COLORS.brown,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}>
            <Text style={{ color: BRAND_COLORS.white, fontSize: 12, fontFamily: 'Helvetica-Bold' }}>E</Text>
          </View>
          <Text style={sharedStyles.cardTitle}>Exercise & Training</Text>
        </View>
        
        <View style={{ marginBottom: 10 }}>
          <Text style={{ ...sharedStyles.h3, marginBottom: 4 }}>Exercise Needs</Text>
          <Text style={sharedStyles.body}>
            {dog.breed} dogs typically need moderate daily exercise. Aim for 30-60 minutes of activity daily, 
            including walks, playtime, and mental stimulation. Puppies need shorter, more frequent play sessions.
          </Text>
        </View>
        
        <View style={{ marginBottom: 10 }}>
          <Text style={{ ...sharedStyles.h3, marginBottom: 4 }}>Training Tips</Text>
          <View style={{ paddingLeft: 10 }}>
            <Text style={{ ...sharedStyles.body, marginBottom: 3 }}>
              • Start training early - socialization is crucial in the first 16 weeks
            </Text>
            <Text style={{ ...sharedStyles.body, marginBottom: 3 }}>
              • Use positive reinforcement - treats, praise, and play work best
            </Text>
            <Text style={{ ...sharedStyles.body, marginBottom: 3 }}>
              • Keep sessions short (5-10 minutes) and end on a positive note
            </Text>
            <Text style={{ ...sharedStyles.body, marginBottom: 3 }}>
              • Be consistent with commands and rules across all family members
            </Text>
            <Text style={sharedStyles.body}>
              • Consider puppy classes or professional training for best results
            </Text>
          </View>
        </View>
        
        <View style={{
          backgroundColor: '#22c55e15',
          padding: 8,
          borderRadius: 4,
          borderLeftWidth: 3,
          borderLeftColor: '#22c55e',
        }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#166534', marginBottom: 2 }}>
            TIP: Pro Tip
          </Text>
          <Text style={{ fontSize: 8, color: BRAND_COLORS.gray[700] }}>
            Mental stimulation is just as important as physical exercise. Use puzzle toys, training games, 
            and new experiences to keep your dog engaged and happy.
          </Text>
        </View>
      </View>
      
      {/* Veterinary Care */}
      <View style={sharedStyles.card}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: BRAND_COLORS.brown,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}>
            <Text style={{ color: BRAND_COLORS.white, fontSize: 12, fontFamily: 'Helvetica-Bold' }}>V</Text>
          </View>
          <Text style={sharedStyles.cardTitle}>Veterinary Care</Text>
        </View>
        
        <View style={{ marginBottom: 10 }}>
          <Text style={{ ...sharedStyles.h3, marginBottom: 4 }}>Recommended Schedule</Text>
          <View style={sharedStyles.row}>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>FIRST VET VISIT</Text>
              <Text style={sharedStyles.body}>Within 72 hours of bringing puppy home</Text>
            </View>
            <View style={sharedStyles.col2}>
              <Text style={sharedStyles.label}>WELLNESS EXAMS</Text>
              <Text style={sharedStyles.body}>Annually (bi-annually for seniors)</Text>
            </View>
          </View>
        </View>
        
        <View style={{ marginBottom: 10 }}>
          <Text style={{ ...sharedStyles.h3, marginBottom: 4 }}>Vaccination Schedule</Text>
          <Text style={sharedStyles.body}>
            Continue vaccinations as recommended by your veterinarian. Core vaccines typically include 
            DHPP (distemper, hepatitis, parvo, parainfluenza) and rabies. Your vet may recommend 
            additional vaccines based on lifestyle and location.
          </Text>
        </View>
        
        <View style={{ marginBottom: 10 }}>
          <Text style={{ ...sharedStyles.h3, marginBottom: 4 }}>Preventative Care</Text>
          <View style={{ paddingLeft: 10 }}>
            <Text style={{ ...sharedStyles.body, marginBottom: 2 }}>
              • Heartworm prevention - year-round monthly treatment
            </Text>
            <Text style={{ ...sharedStyles.body, marginBottom: 2 }}>
              • Flea & tick prevention - monthly, especially in warm months
            </Text>
            <Text style={sharedStyles.body}>
              • Regular deworming - as recommended by your vet
            </Text>
          </View>
        </View>
        
        <View style={{
          backgroundColor: '#ef444415',
          padding: 8,
          borderRadius: 4,
          borderLeftWidth: 3,
          borderLeftColor: '#ef4444',
        }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#991b1b', marginBottom: 2 }}>
            ALERT: When to Seek Emergency Care
          </Text>
          <Text style={{ fontSize: 8, color: BRAND_COLORS.gray[700] }}>
            Difficulty breathing, persistent vomiting/diarrhea, bloated abdomen, inability to urinate, 
            seizures, loss of consciousness, severe bleeding, or trauma. When in doubt, call your vet.
          </Text>
        </View>
      </View>
      
      {/* Contact Information */}
      <View style={{
        ...sharedStyles.card,
        backgroundColor: BRAND_COLORS.brown,
        marginTop: 15,
      }}>
        <Text style={{
          fontSize: 12,
          fontFamily: 'Helvetica',
          fontWeight: 'bold',
          color: BRAND_COLORS.white,
          marginBottom: 8,
        }}>
          Questions? We're Here to Help!
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {breederSettings.breederName && (
            <View style={{ width: '50%', marginBottom: 6 }}>
              <Text style={{ fontSize: 8, color: BRAND_COLORS.beige }}>Breeder</Text>
              <Text style={{ fontSize: 10, color: BRAND_COLORS.white }}>
                {breederSettings.breederName}
              </Text>
            </View>
          )}
          {breederSettings.phone && (
            <View style={{ width: '50%', marginBottom: 6 }}>
              <Text style={{ fontSize: 8, color: BRAND_COLORS.beige }}>Phone</Text>
              <Text style={{ fontSize: 10, color: BRAND_COLORS.white }}>
                {breederSettings.phone}
              </Text>
            </View>
          )}
          {breederSettings.email && (
            <View style={{ width: '50%', marginBottom: 6 }}>
              <Text style={{ fontSize: 8, color: BRAND_COLORS.beige }}>Email</Text>
              <Text style={{ fontSize: 10, color: BRAND_COLORS.white }}>
                {breederSettings.email}
              </Text>
            </View>
          )}
          {breederSettings.kennelName && (
            <View style={{ width: '50%', marginBottom: 6 }}>
              <Text style={{ fontSize: 8, color: BRAND_COLORS.beige }}>Kennel</Text>
              <Text style={{ fontSize: 10, color: BRAND_COLORS.white }}>
                {breederSettings.kennelName}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={{
          fontSize: 9,
          color: BRAND_COLORS.beige,
          marginTop: 10,
          fontStyle: 'normal',
        }}>
          We love to hear updates about our puppies! Feel free to send photos and updates anytime.
        </Text>
      </View>
    </View>
  );
}

