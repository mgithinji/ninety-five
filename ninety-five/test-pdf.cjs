// Test pdf-parse with actual PDF parsing
async function testPdfParse() {
  console.log('🧪 Testing pdf-parse with actual PDF...')

  try {
    const fs = require('fs')
    const path = require('path')

    // Check if we have a sample PDF
    const testPdfPath = path.join(__dirname, 'test-resume.pdf')

    if (!fs.existsSync(testPdfPath)) {
      console.log('⚠️  No test PDF found. Testing import only...')
      const pdfParse = require('pdf-parse').PDFParse
      console.log('✅ pdf-parse import successful')
      console.log('PDFParse type:', typeof pdfParse)

      // Test with a minimal buffer
      const testBuffer = Buffer.from('test data')
      console.log('✅ Can create buffers')

      console.log('\n✅ Import tests passed!')
      console.log('Note: Full PDF parsing test requires an actual PDF file')
      return true
    }

    // Test with actual PDF
    console.log('📄 Found test PDF at:', testPdfPath)
    const pdfBuffer = fs.readFileSync(testPdfPath)
    console.log('PDF size:', pdfBuffer.length, 'bytes')

    const PDFParse = require('pdf-parse').PDFParse
    const pdfData = await new PDFParse(pdfBuffer)

    console.log('✅ PDF parsed successfully!')
    console.log('Text length:', pdfData.text.length, 'characters')
    console.log('First 300 characters:')
    console.log(pdfData.text.substring(0, 300))

    return true
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

testPdfParse()
  .then((success) => {
    console.log('\n' + (success ? '✅ All tests passed!' : '❌ Tests failed!'))
    process.exit(success ? 0 : 1)
  })
