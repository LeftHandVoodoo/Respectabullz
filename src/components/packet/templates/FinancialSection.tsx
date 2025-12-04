/**
 * FinancialSection - Invoice, receipt, deposit history, and payment details
 * Professional invoice-style layout for financial documentation
 */
import { View, Text } from '@react-pdf/renderer';
import { sharedStyles, BRAND_COLORS, formatDate, formatCurrency, formatPaymentStatus } from '@/lib/pdfExport';
import type { PacketData } from '@/types';

interface FinancialSectionProps {
  data: PacketData;
}

export function FinancialSection({ data }: FinancialSectionProps) {
  const { dog, sale, client, expenses, breederSettings } = data;
  
  if (!sale) {
    return (
      <View style={sharedStyles.section}>
        <View style={sharedStyles.sectionHeader}>
          <Text style={sharedStyles.sectionTitle}>Financial Information</Text>
        </View>
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.body}>No sale record found for this dog.</Text>
        </View>
      </View>
    );
  }
  
  // Get the puppy's specific price from sale
  const puppyInSale = sale.puppies?.find(p => p.dogId === dog.id);
  const puppyPrice = puppyInSale?.price || sale.price;
  
  // Calculate amounts
  const depositAmount = sale.depositAmount || 0;
  const totalPrice = puppyPrice;
  const balanceDue = totalPrice - depositAmount;
  
  // Related expenses for this dog
  const dogExpenses = expenses.filter(e => e.relatedDogId === dog.id);
  
  return (
    <View style={sharedStyles.section}>
      {/* Section Header */}
      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Financial Information</Text>
      </View>
      
      {/* Invoice/Receipt Card */}
      <View style={{
        ...sharedStyles.card,
        padding: 0,
        overflow: 'hidden',
      }}>
        {/* Invoice Header */}
        <View style={{
          backgroundColor: BRAND_COLORS.brown,
          padding: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          <View>
            <Text style={{
              fontSize: 16,
              fontFamily: 'Helvetica',
              fontWeight: 'bold',
              color: BRAND_COLORS.white,
            }}>
              {sale.paymentStatus === 'paid_in_full' ? 'RECEIPT' : 'INVOICE'}
            </Text>
            <Text style={{
              fontSize: 8,
              color: BRAND_COLORS.beige,
              marginTop: 2,
            }}>
              Sale Date: {formatDate(sale.saleDate)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{
              fontSize: 12,
              fontFamily: 'Helvetica-Bold',
              color: BRAND_COLORS.white,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              {breederSettings.kennelName || 'RESPECTABULLZ'}
            </Text>
            {breederSettings.phone && (
              <Text style={{ fontSize: 8, color: BRAND_COLORS.beige }}>
                {breederSettings.phone}
              </Text>
            )}
          </View>
        </View>
        
        {/* Bill To / Ship To */}
        <View style={{
          flexDirection: 'row',
          padding: 15,
          borderBottomWidth: 1,
          borderBottomColor: BRAND_COLORS.gray[200],
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 8,
              color: BRAND_COLORS.gray[500],
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              Bill To
            </Text>
            {client ? (
              <>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica', fontWeight: 'bold', color: BRAND_COLORS.gray[800] }}>
                  {client.name}
                </Text>
                {client.addressLine1 && (
                  <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600] }}>
                    {client.addressLine1}
                  </Text>
                )}
                {client.addressLine2 && (
                  <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600] }}>
                    {client.addressLine2}
                  </Text>
                )}
                {(client.city || client.state || client.postalCode) && (
                  <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600] }}>
                    {[client.city, client.state, client.postalCode].filter(Boolean).join(', ')}
                  </Text>
                )}
                {client.email && (
                  <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600], marginTop: 2 }}>
                    {client.email}
                  </Text>
                )}
                {client.phone && (
                  <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600] }}>
                    {client.phone}
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ fontSize: 10, color: BRAND_COLORS.gray[500] }}>
                Customer information not available
              </Text>
            )}
          </View>
          
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{
              fontSize: 8,
              color: BRAND_COLORS.gray[500],
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              Seller
            </Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND_COLORS.gray[800] }}>
              {breederSettings.breederName || breederSettings.kennelName}
            </Text>
            {breederSettings.addressLine1 && (
              <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600] }}>
                {breederSettings.addressLine1}
              </Text>
            )}
            {(breederSettings.city || breederSettings.state || breederSettings.postalCode) && (
              <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600] }}>
                {[breederSettings.city, breederSettings.state, breederSettings.postalCode].filter(Boolean).join(', ')}
              </Text>
            )}
            {breederSettings.email && (
              <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600], marginTop: 2 }}>
                {breederSettings.email}
              </Text>
            )}
          </View>
        </View>
        
        {/* Line Items */}
        <View style={{ padding: 15 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: BRAND_COLORS.gray[300],
          }}>
            <Text style={{ ...sharedStyles.label, flex: 3 }}>DESCRIPTION</Text>
            <Text style={{ ...sharedStyles.label, flex: 1, textAlign: 'right' }}>AMOUNT</Text>
          </View>
          
          {/* Item row */}
          <View style={{
            flexDirection: 'row',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: BRAND_COLORS.gray[200],
          }}>
            <View style={{ flex: 3 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND_COLORS.gray[800] }}>
                {dog.name}
              </Text>
              <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600] }}>
                {dog.breed} • {dog.sex === 'M' ? 'Male' : 'Female'} • {dog.color || 'Color not specified'}
              </Text>
              {dog.registrationNumber && (
                <Text style={{ fontSize: 8, fontFamily: 'Courier', color: BRAND_COLORS.gray[500], marginTop: 2 }}>
                  Reg: {dog.registrationNumber}
                </Text>
              )}
              {dog.microchipNumber && (
                <Text style={{ fontSize: 8, fontFamily: 'Courier', color: BRAND_COLORS.gray[500] }}>
                  Microchip: {dog.microchipNumber}
                </Text>
              )}
            </View>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', fontFamily: 'Helvetica', fontWeight: 'bold' }}>
              {formatCurrency(totalPrice)}
            </Text>
          </View>
          
          {/* Subtotal */}
          <View style={{
            flexDirection: 'row',
            paddingTop: 10,
          }}>
            <View style={{ flex: 3, alignItems: 'flex-end', paddingRight: 10 }}>
              <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600] }}>Subtotal</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 10, textAlign: 'right' }}>
              {formatCurrency(totalPrice)}
            </Text>
          </View>
          
          {/* Deposit */}
          {depositAmount > 0 && (
            <View style={{
              flexDirection: 'row',
              paddingTop: 4,
            }}>
              <View style={{ flex: 3, alignItems: 'flex-end', paddingRight: 10 }}>
                <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600] }}>
                  Deposit Received {sale.depositDate ? `(${formatDate(sale.depositDate)})` : ''}
                </Text>
              </View>
              <Text style={{ flex: 1, fontSize: 10, textAlign: 'right', color: '#22c55e' }}>
                -{formatCurrency(depositAmount)}
              </Text>
            </View>
          )}
          
          {/* Total / Balance Due */}
          <View style={{
            flexDirection: 'row',
            paddingTop: 10,
            marginTop: 6,
            borderTopWidth: 2,
            borderTopColor: BRAND_COLORS.brown,
          }}>
            <View style={{ flex: 3, alignItems: 'flex-end', paddingRight: 10 }}>
              <Text style={{
                fontSize: 11,
                fontFamily: 'Helvetica',
              fontWeight: 'bold',
                color: BRAND_COLORS.brown,
              }}>
                {sale.paymentStatus === 'paid_in_full' ? 'TOTAL PAID' : 'BALANCE DUE'}
              </Text>
            </View>
            <Text style={{
              flex: 1,
              fontSize: 14,
              textAlign: 'right',
              fontFamily: 'Helvetica',
              fontWeight: 'bold',
              color: sale.paymentStatus === 'paid_in_full' ? '#22c55e' : BRAND_COLORS.brown,
            }}>
              {formatCurrency(sale.paymentStatus === 'paid_in_full' ? totalPrice : balanceDue)}
            </Text>
          </View>
        </View>
        
        {/* Payment Status Badge */}
        <View style={{
          backgroundColor: BRAND_COLORS.gray[100],
          padding: 10,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: sale.paymentStatus === 'paid_in_full' ? '#22c55e' : 
                            sale.paymentStatus === 'refunded' ? '#ef4444' : '#f59e0b',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 4,
          }}>
            <Text style={{
              fontSize: 9,
              fontFamily: 'Helvetica',
              fontWeight: 'bold',
              color: BRAND_COLORS.white,
              textTransform: 'uppercase',
            }}>
              {formatPaymentStatus(sale.paymentStatus)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Payment History / Details */}
      <View style={{ ...sharedStyles.card, marginTop: 15 }}>
        <Text style={sharedStyles.cardTitle}>Payment Details</Text>
        
        <View style={sharedStyles.row}>
          <View style={sharedStyles.col2}>
            <Text style={sharedStyles.label}>SALE DATE</Text>
            <Text style={sharedStyles.value}>{formatDate(sale.saleDate)}</Text>
          </View>
          <View style={sharedStyles.col2}>
            <Text style={sharedStyles.label}>PICKUP/DELIVERY</Text>
            <Text style={sharedStyles.value}>
              {sale.isLocalPickup ? 'Local Pickup' : 'Shipped'}
            </Text>
          </View>
        </View>
        
        {(sale.shippedDate || sale.receivedDate) && (
          <View style={{ ...sharedStyles.row, marginTop: 8 }}>
            {sale.shippedDate && (
              <View style={sharedStyles.col2}>
                <Text style={sharedStyles.label}>SHIPPED DATE</Text>
                <Text style={sharedStyles.value}>{formatDate(sale.shippedDate)}</Text>
              </View>
            )}
            {sale.receivedDate && (
              <View style={sharedStyles.col2}>
                <Text style={sharedStyles.label}>RECEIVED DATE</Text>
                <Text style={sharedStyles.value}>{formatDate(sale.receivedDate)}</Text>
              </View>
            )}
          </View>
        )}
        
        {sale.registrationTransferDate && (
          <View style={{ marginTop: 8 }}>
            <Text style={sharedStyles.label}>REGISTRATION TRANSFERRED</Text>
            <Text style={sharedStyles.value}>{formatDate(sale.registrationTransferDate)}</Text>
          </View>
        )}
        
        {sale.warrantyInfo && (
          <View style={{ marginTop: 8 }}>
            <Text style={sharedStyles.label}>WARRANTY INFORMATION</Text>
            <Text style={sharedStyles.body}>{sale.warrantyInfo}</Text>
          </View>
        )}
        
        {sale.notes && (
          <View style={{ marginTop: 8 }}>
            <Text style={sharedStyles.label}>NOTES</Text>
            <Text style={sharedStyles.body}>{sale.notes}</Text>
          </View>
        )}
      </View>
      
      {/* Related Expenses (if any) */}
      {dogExpenses.length > 0 && (
        <View style={{ ...sharedStyles.card, marginTop: 15 }}>
          <Text style={sharedStyles.cardTitle}>Associated Expenses</Text>
          
          <View style={sharedStyles.table}>
            <View style={sharedStyles.tableHeader}>
              <Text style={{ ...sharedStyles.tableHeaderCell, width: '25%' }}>Date</Text>
              <Text style={{ ...sharedStyles.tableHeaderCell, width: '25%' }}>Category</Text>
              <Text style={{ ...sharedStyles.tableHeaderCell, width: '30%' }}>Description</Text>
              <Text style={{ ...sharedStyles.tableHeaderCell, width: '20%', textAlign: 'right' }}>Amount</Text>
            </View>
            
            {dogExpenses.slice(0, 10).map((expense, index) => (
              <View 
                key={expense.id} 
                style={index % 2 === 0 ? sharedStyles.tableRow : sharedStyles.tableRowAlt}
              >
                <Text style={{ ...sharedStyles.tableCell, width: '25%' }}>
                  {formatDate(expense.date)}
                </Text>
                <Text style={{ ...sharedStyles.tableCell, width: '25%' }}>
                  {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                </Text>
                <Text style={{ ...sharedStyles.tableCell, width: '30%' }}>
                  {expense.description || expense.vendorName || '-'}
                </Text>
                <Text style={{ ...sharedStyles.tableCell, width: '20%', textAlign: 'right' }}>
                  {formatCurrency(expense.amount)}
                </Text>
              </View>
            ))}
          </View>
          
          {dogExpenses.length > 10 && (
            <Text style={{ ...sharedStyles.caption, marginTop: 4 }}>
              Showing 10 of {dogExpenses.length} expenses
            </Text>
          )}
          
          {/* Total expenses */}
          <View style={{
            marginTop: 10,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: BRAND_COLORS.gray[200],
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}>
            <Text style={{ fontSize: 9, color: BRAND_COLORS.gray[600], marginRight: 10 }}>
              Total Expenses:
            </Text>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND_COLORS.brown }}>
              {formatCurrency(dogExpenses.reduce((sum, e) => sum + e.amount, 0))}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

