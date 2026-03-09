import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// date necesare pentru factura
interface OrderItem {
    productName: string;
    quantity: number;
    price: number; // Pretul CU tva (asa cum e in baza ta de date)
    subTotal: number; // Subtotal CU tva
}

interface OrderDetails {
    id: number;
    createdAt: string;
    status: string;
    totalPrice: number;
    items: OrderItem[];
    userEmail?: string;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    }).format(date);
};

export const generateInvoicePDF = (order: OrderDetails, clientName: string = "Customer") => {
    
    // Preluam variabilele de mediu cu fallback-uri de siguranta
    const STORE_NAME = import.meta.env.VITE_STORE_NAME || "Grocery Store";
    const STORE_EMAIL = import.meta.env.VITE_STORE_EMAIL || "contact@store.com";
    const TVA_PERCENT = Number(import.meta.env.VITE_TVA_PERCENTAGE) || 19; 
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColor: [number, number, number] = [19, 76, 156]; // #134c9c
    const secondaryColor: [number, number, number] = [100, 116, 139]; // Text secundar
    
    // --- HEADER ---
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 15, 'F');

    doc.setFontSize(24);
    doc.setTextColor(19, 76, 156);
    doc.setFont("helvetica", "bold");
    doc.text(STORE_NAME, 15, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "normal");
    doc.text("Bucharest, Romania", 15, 36);
    doc.text(STORE_EMAIL, 15, 41);

    doc.setFontSize(28);
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth - 15, 32, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Invoice Number:`, pageWidth - 45, 40, { align: "right" });
    doc.setTextColor(0, 0, 0);
    doc.text(`#INV-${10000 + order.id}`, pageWidth - 15, 40, { align: "right" });
    
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Order Date:`, pageWidth - 50  , 46, { align: "right" });
    doc.setTextColor(0, 0, 0);
    doc.text(formatDate(order.createdAt).split(' - ')[0], pageWidth - 15, 46, { align: "right" });

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(15, 55, pageWidth - 15, 55);

    // --- SECTIUNEA BILL TO ---
    
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO:", 15, 65);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(clientName, 15, 72);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    if(order.userEmail) {
         doc.text(order.userEmail, 15, 78);
    }
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT STATUS:", pageWidth - 15, 65, { align: "right" });
    
    doc.setFontSize(12);
    if(order.status === 'CANCELLED') {
        doc.setTextColor(220, 38, 38);
    } else {
        doc.setTextColor(22, 163, 74); 
    }
    doc.text(order.status, pageWidth - 15, 72, { align: "right" });

    // --- TABELUL CU PRODUSE (Preturi Extinse) ---
    
    // Functie helper pentru calculare pret fara TVA (Daca pretul cu tva este 119 lei, pretul fara tva este 100)
    const getBasePrice = (priceWithTva: number) => priceWithTva / (1 + (TVA_PERCENT / 100));
    
    let totalTaxAmount = 0; // Vom calcula valoarea totala a TVA-ului de pe toata factura
    let totalWithoutTax = 0;

    const tableColumn = ["Item", "Qty", "Unit Price\n(Excl. VAT)", "VAT\nAmount", "Total Price\n(Incl. VAT)"];
    const tableRows: any[] = [];

    order.items.forEach(item => {
        // Pretul pe care il avem in baza de date este deja cel de vanzare (inclusiv TVA).
        // Il recalculam invers pentru a gasi valoarea neta:
        const unitPriceWithoutTax = getBasePrice(item.price);
        const itemTaxAmount = item.price - unitPriceWithoutTax;
        
        // totalurile pe linie
        const subTotalWithoutTax = unitPriceWithoutTax * item.quantity;
        const totalLineTax = itemTaxAmount * item.quantity;
        
        // Adunam la totalul general (ca sa le afisam jos)
        totalWithoutTax += subTotalWithoutTax;
        totalTaxAmount += totalLineTax;

        tableRows.push([
            item.productName,
            item.quantity.toString(),
            `${unitPriceWithoutTax.toFixed(2)} Lei`,
            `${totalLineTax.toFixed(2)} Lei`,
            `${item.subTotal.toFixed(2)} Lei`
        ]);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        theme: 'plain',
        headStyles: { 
            fillColor: [248, 250, 252], 
            textColor: [71, 85, 105], 
            fontStyle: 'bold',
            lineColor: [226, 232, 240],
            lineWidth: { bottom: 1 },
            halign: 'center' // Aliniem tot tabelul la centru default
        },
        bodyStyles: {
            textColor: [15, 23, 42],
            lineColor: [241, 245, 249],
            lineWidth: { bottom: 1 },
            halign: 'right'
        },
        columnStyles: {
            0: { cellWidth: 70, fontStyle: 'bold', halign: 'left' }, // Doar numele produsului e la stanga
            1: { halign: 'center' },
            2: {halign: 'center'},
            3: {halign: 'center'},
            4: { fontStyle: 'bold', textColor: primaryColor, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
    });

    // --- SECTIUNEA DE TOTALURI ---
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const rightColX = pageWidth - 15;
    const leftColX = pageWidth - 60;
    
    const sumOfItemsWithTax = order.items.reduce((acc, it) => acc + it.subTotal, 0);
    const promoDiscount = sumOfItemsWithTax - order.totalPrice;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let currentY = finalY;

    // Total Fara TVA
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Total (Excl. VAT)", leftColX, currentY);
    doc.setTextColor(0, 0, 0);
    doc.text(`${totalWithoutTax.toFixed(2)} Lei`, rightColX, currentY, { align: "right" });
    currentY += 8;

    // Total Valoare TVA
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`VAT (${TVA_PERCENT}%)`, leftColX, currentY);
    doc.setTextColor(0, 0, 0);
    doc.text(`${totalTaxAmount.toFixed(2)} Lei`, rightColX, currentY, { align: "right" });
    currentY += 8;

    // Subtotal (Daca a existat vreo promotie pe toata comanda aplicata)
    if (promoDiscount > 0.05) {
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text("Subtotal", leftColX, currentY);
        doc.setTextColor(0, 0, 0);
        doc.text(`${sumOfItemsWithTax.toFixed(2)} Lei`, rightColX, currentY, { align: "right" });
        currentY += 8;
        
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text("Discount", leftColX, currentY);
        doc.setTextColor(220, 38, 38); // Rosu
        doc.text(`-${promoDiscount.toFixed(2)} Lei`, rightColX, currentY, { align: "right" });
        currentY += 8;
    }

    // Shipping
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Shipping", leftColX, currentY);
    doc.setTextColor(0, 0, 0);
    doc.text("0.00 Lei", rightColX, currentY, { align: "right" });
    currentY += 10;
    
    // Linie inainte de total
    doc.setDrawColor(200, 200, 200);
    doc.line(leftColX, currentY - 4, rightColX, currentY - 4);
    
    // Total General (inclusiv toate taxele si reducerile)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Total Due", leftColX, currentY + 2);
    
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${order.totalPrice.toFixed(2)} Lei`, rightColX, currentY + 2, { align: "right" });

    // --- FOOTER ---
    
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(2);
    doc.line(15, pageHeight - 25, 30, pageHeight - 25);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Thank you for your business.`, 15, pageHeight - 18);
    doc.text(`If you have any questions about this invoice, please contact us at ${STORE_EMAIL}.`, 15, pageHeight - 13);

    doc.save(`Invoice_INV-${10000 + order.id}.pdf`);
};