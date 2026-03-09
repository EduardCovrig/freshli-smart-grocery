import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// date pentru comanda
interface OrderItem {
    productName: string;
    quantity: number;
    price: number;
    subTotal: number;
}

interface OrderDetails {
    id: number;
    createdAt: string;
    status: string;
    totalPrice: number;
    items: OrderItem[];
    userEmail?: string;
}

// Functie de formatare data
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
        day: 'numeric', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    }).format(date);
};

export const generateInvoicePDF = (order: OrderDetails, clientName: string = "Customer") => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // 1. Header Factura
    doc.setFontSize(22);
    doc.setTextColor(19, 76, 156); // albastru inchis
    doc.text("EdwC Store", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("INVOICE", pageWidth - 14, 22, { align: "right" });
    
    // 2. Detalii Comanda si Client
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Order ID: #${order.id}`, 14, 40);
    doc.text(`Date: ${formatDate(order.createdAt)}`, 14, 47);
    doc.text(`Status: ${order.status}`, 14, 54);
    
    doc.text(`Billed To:`, pageWidth - 14, 40, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(clientName, pageWidth - 14, 47, { align: "right" });
    if(order.userEmail) {
         doc.setFont("helvetica", "normal");
         doc.text(order.userEmail, pageWidth - 14, 54, { align: "right" });
    }
    
    // Linie despartitoare
    doc.setDrawColor(200);
    doc.line(14, 62, pageWidth - 14, 62);

    // 3. Tabel Produse (folosind autotable)
    const tableColumn = ["Product", "Qty", "Unit Price", "Subtotal"];
    const tableRows: any[] = [];

    order.items.forEach(item => {
        const rowData = [
            item.productName,
            item.quantity.toString(),
            `${item.price.toFixed(2)} Lei`,
            `${item.subTotal.toFixed(2)} Lei`
        ];
        tableRows.push(rowData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [19, 76, 156], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' }
        }
    });

    // 4. Totals (dupa tabel)
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Calculam daca a avut discount promo 
    const sumOfItems = order.items.reduce((acc, it) => acc + it.subTotal, 0);
    const promoDiscount = sumOfItems - order.totalPrice;
    
    if (promoDiscount > 0.05) {
        doc.text("Subtotal:", pageWidth - 50, finalY);
        doc.text(`${sumOfItems.toFixed(2)} Lei`, pageWidth - 14, finalY, { align: "right" });
        
        doc.setTextColor(255, 0, 0); // Rosu pt discount
        doc.text("Promo Applied:", pageWidth - 50, finalY + 7);
        doc.text(`-${promoDiscount.toFixed(2)} Lei`, pageWidth - 14, finalY + 7, { align: "right" });
        doc.setTextColor(0); // Inapoi la negru
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL:", pageWidth - 50, finalY + 17);
        doc.text(`${order.totalPrice.toFixed(2)} Lei`, pageWidth - 14, finalY + 17, { align: "right" });
    } else {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL:", pageWidth - 50, finalY);
        doc.text(`${order.totalPrice.toFixed(2)} Lei`, pageWidth - 14, finalY, { align: "right" });
    }

    // Mesaj de incheiere jos de tot
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text("Thank you for shopping with EdwC Store!", pageWidth / 2, doc.internal.pageSize.height - 20, { align: "center" });

    // 5. Salvarea fisierului
    doc.save(`Invoice_Order_${order.id}.pdf`);
};