/**
 * Verification script for the differential equation solution
 * dy/dx = 2xy/(1 + x²), y(0) = 1
 * 
 * Solution: y = 1 + x²
 */

function verifySolution() {
  console.log("Verifying solution: y = 1 + x²\n")
  
  // Test points
  const testPoints = [0, 0.5, 1, 2, 5]
  
  console.log("x\t| y(x) = 1 + x²\t| dy/dx (from solution)\t| 2xy/(1+x²) (from DE)\t| Match?")
  console.log("-".repeat(80))
  
  for (const x of testPoints) {
    // Solution value
    const y = 1 + x * x
    
    // Derivative of solution: d/dx(1 + x²) = 2x
    const dydxFromSolution = 2 * x
    
    // Value from differential equation: 2xy/(1 + x²)
    const dydxFromDE = (2 * x * y) / (1 + x * x)
    
    // Check if they match (within floating point tolerance)
    const matches = Math.abs(dydxFromSolution - dydxFromDE) < 1e-10
    
    console.log(`${x}\t| ${y.toFixed(4)}\t\t| ${dydxFromSolution.toFixed(4)}\t\t\t| ${dydxFromDE.toFixed(4)}\t\t\t| ${matches ? '✓' : '✗'}`)
  }
  
  // Check initial condition
  const y0 = 1 + 0 * 0
  console.log(`\nInitial condition check: y(0) = ${y0} (expected: 1) ${y0 === 1 ? '✓' : '✗'}`)
  
  console.log("\n✅ Solution verified: y = 1 + x²")
}

verifySolution()



