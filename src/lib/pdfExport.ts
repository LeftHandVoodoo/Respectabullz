/**
 * PDF Export utilities and shared styles for Customer Packet generation.
 * Uses @react-pdf/renderer for PDF generation.
 */
import { StyleSheet } from '@react-pdf/renderer';

// Brand colors from project rules
export const BRAND_COLORS = {
  beige: '#fbf1e5',
  brown: '#6e5e44',
  blue: '#303845',
  // Additional premium colors
  darkBrown: '#4a3d2a',
  lightBrown: '#8c7a5c',
  cream: '#fef9f3',
  gold: '#c9a95c',
  white: '#ffffff',
  black: '#1a1a1a',
  gray: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
};

// Use Helvetica as the primary font (built into react-pdf, always available)
// Helvetica is a clean sans-serif font similar to TechnaSans
// This ensures PDF generation always works reliably
// Note: We use 'Helvetica' directly - it's a built-in font family in react-pdf
// No registration needed for built-in fonts

// Shared styles for premium/luxury feel
export const sharedStyles = StyleSheet.create({
  // Page styles
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: BRAND_COLORS.white,
    paddingTop: 35,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  pageLandscape: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: BRAND_COLORS.white,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_COLORS.brown,
  },
  headerText: {
    flex: 1,
    marginLeft: 15,
  },
  kennelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_COLORS.brown,
    fontFamily: 'Helvetica',
    letterSpacing: 1,
  },
  headerContact: {
    fontSize: 8,
    color: BRAND_COLORS.gray[600],
    marginTop: 2,
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.gray[200],
  },
  footerText: {
    fontSize: 8,
    color: BRAND_COLORS.gray[500],
  },
  pageNumber: {
    fontSize: 8,
    color: BRAND_COLORS.gray[500],
  },
  
  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.brown,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND_COLORS.brown,
    fontFamily: 'Helvetica',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[200],
    marginVertical: 15,
  },
  
  // Card styles (premium box style)
  card: {
    backgroundColor: BRAND_COLORS.cream,
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[200],
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND_COLORS.brown,
    fontFamily: 'Helvetica',
    marginBottom: 6,
  },
  cardContent: {
    fontSize: 9,
    color: BRAND_COLORS.gray[700],
    lineHeight: 1.4,
  },
  
  // Row/Grid styles
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  col2: {
    width: '50%',
    paddingRight: 10,
  },
  col3: {
    width: '33.33%',
    paddingRight: 10,
  },
  col4: {
    width: '25%',
    paddingRight: 10,
  },
  
  // Typography
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_COLORS.brown,
    fontFamily: 'Helvetica',
    marginBottom: 10,
    letterSpacing: 2,
  },
  h2: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_COLORS.brown,
    fontFamily: 'Helvetica',
    marginBottom: 8,
    letterSpacing: 1,
  },
  h3: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND_COLORS.darkBrown,
    fontFamily: 'Helvetica',
    marginBottom: 4,
  },
  body: {
    fontSize: 10,
    color: BRAND_COLORS.gray[700],
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: 9,
    color: BRAND_COLORS.gray[600],
    lineHeight: 1.4,
  },
  caption: {
    fontSize: 8,
    color: BRAND_COLORS.gray[500],
    fontStyle: 'normal', // TechnaSans doesn't have italic, use normal
  },
  label: {
    fontSize: 8,
    color: BRAND_COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: BRAND_COLORS.gray[800],
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  
  // Badge/Tag styles
  badge: {
    backgroundColor: BRAND_COLORS.brown,
    color: BRAND_COLORS.white,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  badgeOutline: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.brown,
    color: BRAND_COLORS.brown,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    fontSize: 8,
  },
  badgeSuccess: {
    backgroundColor: '#22c55e',
    color: BRAND_COLORS.white,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  badgeWarning: {
    backgroundColor: '#f59e0b',
    color: BRAND_COLORS.white,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  
  // Image styles
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    objectFit: 'cover',
    borderWidth: 3,
    borderColor: BRAND_COLORS.brown,
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[200],
  },
  inlineImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    objectFit: 'cover',
    marginRight: 10,
    marginBottom: 10,
  },
  
  // Table styles
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND_COLORS.brown,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: BRAND_COLORS.white,
    fontFamily: 'Helvetica',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[200],
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[200],
    backgroundColor: BRAND_COLORS.cream,
  },
  tableCell: {
    fontSize: 9,
    color: BRAND_COLORS.gray[700],
  },
  
  // Cover page specific
  coverPage: {
    backgroundColor: BRAND_COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  coverDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: BRAND_COLORS.brown,
  },
  coverDecorationBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: BRAND_COLORS.brown,
  },
  coverLogo: {
    width: 150,
    height: 150,
    objectFit: 'contain',
    marginBottom: 20,
  },
  headerLogo: {
    width: 40,
    height: 40,
    objectFit: 'contain',
  },
  thankYouLogo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
    marginBottom: 15,
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: BRAND_COLORS.brown,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  // Brand text styled to match the app's aesthetic
  brandText: {
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLORS.brown,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  brandTextLarge: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLORS.brown,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  brandTextSmall: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLORS.brown,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  coverSubtitle: {
    fontSize: 18,
    color: BRAND_COLORS.lightBrown,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 40,
  },
  coverDogName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BRAND_COLORS.darkBrown,
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  coverDogPhoto: {
    width: 200,
    height: 200,
    borderRadius: 100,
    objectFit: 'cover',
    borderWidth: 4,
    borderColor: BRAND_COLORS.brown,
  },
  coverInfo: {
    marginTop: 30,
    alignItems: 'center',
  },
  coverInfoText: {
    fontSize: 12,
    color: BRAND_COLORS.gray[600],
    marginBottom: 4,
  },
});

// Utility functions
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateAge(birthDate: Date | string | null | undefined): string {
  if (!birthDate) return 'Unknown';
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(birth.getTime())) return 'Unknown';
  
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const totalMonths = years * 12 + months;
  
  if (totalMonths < 1) {
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return '0 days';
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  if (totalMonths < 12) {
    return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
  }
  
  if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}

export function formatSex(sex: 'M' | 'F'): string {
  return sex === 'M' ? 'Male' : 'Female';
}

export function formatWeight(weightLbs: number): string {
  return `${weightLbs.toFixed(1)} lbs`;
}

// Convert image path to base64 for PDF embedding
export async function imagePathToBase64(
  imagePath: string | null | undefined,
  photoBasePath?: string
): Promise<string | null> {
  if (!imagePath) return null;
  
  try {
    // If it's already a data URL or HTTP URL, return as-is
    if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // For Tauri, we need to convert the file path to a usable URL
    // This would use convertFileSrc in a real implementation
    // For now, return null to indicate no image available
    if (photoBasePath) {
      // Try to construct the path
      // const fullPath = `${photoBasePath}/${imagePath}`;
      // In Tauri, we'd use convertFileSrc(fullPath)
      return null; // Placeholder - images will be handled in actual implementation
    }
    
    return null;
  } catch {
    console.error('Error converting image to base64:', imagePath);
    return null;
  }
}

// Get genetic test result color
export function getGeneticTestResultColor(result: string): string {
  switch (result.toLowerCase()) {
    case 'clear':
      return '#22c55e'; // green
    case 'carrier':
      return '#f59e0b'; // amber
    case 'affected':
      return '#ef4444'; // red
    case 'pending':
    default:
      return BRAND_COLORS.gray[500];
  }
}

// Get payment status display
export function formatPaymentStatus(status: string): string {
  switch (status) {
    case 'deposit_only':
      return 'Deposit Only';
    case 'partial':
      return 'Partial Payment';
    case 'paid_in_full':
      return 'Paid in Full';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

