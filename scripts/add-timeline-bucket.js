/**
 * Script to add timeline_bucket field to careers.json
 * 
 * Timeline mapping:
 * - "asap" → typical_years <= 0.5 AND earning_while_learning = true
 * - "6-24-months" → typical_years <= 2
 * - "2-4-years" → typical_years <= 4
 * - "4-plus-years" → typical_years > 4
 */

const fs = require('fs');
const path = require('path');

const careersPath = path.join(__dirname, '../data/output/careers.json');

function getTimelineBucket(career) {
  const timeToJobReady = career.education?.time_to_job_ready;
  
  if (!timeToJobReady) {
    // Default to flexible if no data
    return '4-plus-years';
  }
  
  const typicalYears = timeToJobReady.typical_years ?? 4;
  const earningWhileLearning = timeToJobReady.earning_while_learning ?? false;
  
  // ASAP: Can start earning immediately or very quickly
  if (typicalYears <= 0.5 && earningWhileLearning) {
    return 'asap';
  }
  
  // 6-24 months: Short training/certification
  if (typicalYears <= 2) {
    return '6-24-months';
  }
  
  // 2-4 years: Associates or Bachelor's
  if (typicalYears <= 4) {
    return '2-4-years';
  }
  
  // 4+ years: Advanced degrees
  return '4-plus-years';
}

// Load careers
console.log('Loading careers.json...');
const careers = JSON.parse(fs.readFileSync(careersPath, 'utf8'));

// Add timeline_bucket to each career
let counts = { 'asap': 0, '6-24-months': 0, '2-4-years': 0, '4-plus-years': 0 };

careers.forEach(career => {
  career.timeline_bucket = getTimelineBucket(career);
  counts[career.timeline_bucket]++;
});

// Save updated careers
console.log('Saving updated careers.json...');
fs.writeFileSync(careersPath, JSON.stringify(careers, null, 2));

console.log('\nTimeline bucket distribution:');
console.log(`  ASAP: ${counts['asap']}`);
console.log(`  6-24 months: ${counts['6-24-months']}`);
console.log(`  2-4 years: ${counts['2-4-years']}`);
console.log(`  4+ years: ${counts['4-plus-years']}`);
console.log(`\nTotal careers: ${careers.length}`);
console.log('\nDone!');
