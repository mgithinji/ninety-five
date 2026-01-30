// Test pdf-parse with standard API
async function testStandardApi() {
  console.log('🧪 Testing pdf-parse standard API...')

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

    // Try standard pdf-parse API (without new)
    const pdf = require('pdf-parse')
    console.log('pdf module type:', typeof pdf)
    console.log('pdf keys:', Object.keys(pdf))

    // Try calling it as a function
    const result1 = await pdf(pdfBuffer)
    console.log('\nResult when called as function:')
    console.log('Keys:', Object.keys(result1))

    // Try with PDFParse
    const { PDFParse } = require('pdf-parse')
    const result2 = await PDFParse(pdfBuffer)
    console.log('\nResult when using PDFParse:')
    console.log('Keys:', Object.keys(result2))

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testStandardApi()
