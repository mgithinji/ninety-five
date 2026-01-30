// Debug pdf-parse result structure
async function debugPdfParse() {
  console.log('🔍 Debugging pdf-parse result structure...')

  try {
    const fs = require('fs')
    const path = require('path')

    const testPdfPath = path.join(__dirname, 'test-resume.pdf')

    if (!fs.existsSync(testPdfPath)) {
      console.log('❌ No test PDF found')
      return
    }

    const pdfBuffer = fs.readFileSync(testPdfPath)
    console.log('📄 PDF size:', pdfBuffer.length, 'bytes')

    const PDFParse = require('pdf-parse').PDFParse
    const pdfData = await new PDFParse(pdfBuffer)

    console.log('\n🔍 PDF Data:')
    console.log('Type:', typeof pdfData)
    console.log('Is object:', typeof pdfData === 'object')
    console.log('Keys:', Object.keys(pdfData))
    console.log('\nFull result:')
    console.log(JSON.stringify(pdfData, null, 2))

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugPdfParse()
