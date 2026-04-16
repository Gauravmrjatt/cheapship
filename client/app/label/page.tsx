import React from "react";

export default function ShippingLabel() {
  return (
    <div className="bg-gray-100 p-5 flex justify-center">
      <div className="relative w-[800px] bg-white border-2 border-black overflow-hidden">

        {/* LEFT BORDER */}
        <div className="absolute left-[-30px] top-0 h-full flex items-center">
          <div
            className="text-blue-600/30 font-bold tracking-widest text-sm"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            CHEAPSHIP CHEAPSHIP CHEAPSHIP CHEAPSHIP CHEAPSHIP CHEAPSHIP
          </div>
        </div>

        {/* RIGHT BORDER */}
        <div className="absolute right-[-30px] top-0 h-full flex items-center">
          <div
            className="text-blue-600/30 font-bold tracking-widest text-sm"
            style={{ writingMode: "vertical-rl" }}
          >
            CHEAPSHIP CHEAPSHIP CHEAPSHIP CHEAPSHIP CHEAPSHIP CHEAPSHIP
          </div>
        </div>

        {/* Ship To */}
        <div className="border-b-2 border-black p-3">
          <h3 className="font-bold">Ship To</h3>
          <p>deepak-2</p>
          <p>ward no 13</p>
          <p>Bangalore, Karnataka, India</p>
          <p>560072</p>
          <p>9509698208</p>
        </div>

        {/* Order Info */}
        <div className="border-b-2 border-black p-3 flex justify-between">
          <div>
            <p><strong>Dimensions:</strong> 1x1x1</p>
            <p><strong>Payment:</strong> PREPAID</p>
            <p><strong>Order Total:</strong> ₹1000</p>
            <p><strong>Weight:</strong> 0.1 kg</p>
          </div>

          <div className="text-right">
            <p>DTDC Surface</p>
            <p><strong>AWB:</strong> 7D131030262</p>

            <div className="mt-2 h-14 w-40 bg-[repeating-linear-gradient(to_right,black_0,black_2px,white_2px,white_4px)]"></div>
          </div>
        </div>

        {/* Shipped By */}
        <div className="border-b-2 border-black p-3 flex justify-between">
          <div>
            <h3 className="font-bold">Shipped By</h3>
            <p>MISW REVALTO LLP</p>
            <p>house no 104, amba wadi jaipur - 302013</p>
            <p>Jaipur, Rajasthan</p>
            <p>302013</p>
            <p>6377860521</p>
          </div>

          <div className="text-right">
            <p><strong>Order#:</strong> 614591394</p>

            <div className="mt-2 h-14 w-40 bg-[repeating-linear-gradient(to_right,black_0,black_2px,white_2px,white_4px)]"></div>

            <p><strong>Invoice No:</strong> Retail00259</p>
            <p><strong>Order Date:</strong> 16/04/2026</p>
            <p><strong>GSTIN:</strong> 08ACEFM5006E1ZK</p>
          </div>
        </div>

        {/* Table */}
        <div className="border-b-2 border-black p-3">
          <table className="w-full border border-black text-center">
            <thead>
              <tr>
                <th className="border border-black p-1">Item</th>
                <th className="border border-black p-1">SKU</th>
                <th className="border border-black p-1">Qty</th>
                <th className="border border-black p-1">Price</th>
                <th className="border border-black p-1">Taxable</th>
                <th className="border border-black p-1">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">sdvdav</td>
                <td className="border border-black p-1">SKU-614591</td>
                <td className="border border-black p-1">1</td>
                <td className="border border-black p-1">₹1000</td>
                <td className="border border-black p-1">₹1000</td>
                <td className="border border-black p-1">₹1000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Charges */}
        <div className="border-b-2 border-black p-3 flex justify-between">
          <div>
            <p>Platform Fee: ₹0</p>
            <p>Shipping Charges: ₹0</p>
          </div>
          <div className="text-right">
            <p>Discount: ₹0</p>
            <p>Collectable Amount: ₹0</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-b-2 border-black p-3 text-xs">
          <p>
            All disputes are subject to Haryana Jurisdiction only. Goods once sold
            will only be taken back or exchanged.
          </p>
          <p>This is an auto generated label and does not require signature.</p>
        </div>

        {/* Branding */}
        <div className="text-center p-5">
          <h1 className="text-4xl font-bold text-blue-600">CHEAPSHIP</h1>
          <p>Insta: @cheapship.in</p>
          <p>Support: +91 92511 20527</p>
        </div>

      </div>
    </div>
  );
}