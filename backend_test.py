import requests
import sys
import os
import io
from PIL import Image
import json
from datetime import datetime

class HealthScannerAPITester:
    def __init__(self, base_url="https://ingredient-lens.preview.emergentagent.com"):
        #http://localhost:300
        #https://ingredient-lens.preview.emergentagent.com
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=30)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a test image file for upload"""
        # Create a simple test image
        img = Image.new('RGB', (300, 200), color='white')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes

    def test_health_check(self):
        """Test the root health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_get_ingredients(self):
        """Test getting all ingredients"""
        success, response = self.run_test(
            "Get All Ingredients",
            "GET",
            "api/ingredients",
            200
        )
        
        if success and isinstance(response, dict):
            ingredients = response.get('ingredients', [])
            print(f"   Found {len(ingredients)} ingredients")
            if ingredients:
                sample_ingredient = ingredients[0]
                print(f"   Sample ingredient: {sample_ingredient.get('name', 'Unknown')}")
                print(f"   Risk level: {sample_ingredient.get('risk_level', 'Unknown')}")
        
        return success

    def test_get_scans(self):
        """Test getting scan history"""
        success, response = self.run_test(
            "Get Scan History",
            "GET",
            "api/scans",
            200
        )
        
        if success and isinstance(response, dict):
            scans = response.get('scans', [])
            print(f"   Found {len(scans)} scans in history")
        
        return success

    def test_scan_image(self):
        """Test scanning an image"""
        print("\n🔍 Testing Image Scan...")
        
        # Create test image
        test_image = self.create_test_image()
        
        files = {
            'file': ('test_label.jpg', test_image, 'image/jpeg')
        }
        
        success, response = self.run_test(
            "Scan Food Label Image",
            "POST",
            "api/scan",
            200,
            files=files
        )
        
        if success and isinstance(response, dict):
            print(f"   Scan ID: {response.get('scan_id', 'Unknown')}")
            print(f"   Processing time: {response.get('processing_time', 0):.2f}s")
            
            ingredients = response.get('parsed_ingredients', [])
            print(f"   Found {len(ingredients)} ingredients:")
            
            risk_counts = {'safe': 0, 'caution': 0, 'banned': 0}
            for ingredient in ingredients:
                risk_level = ingredient.get('risk_level', 'unknown')
                if risk_level in risk_counts:
                    risk_counts[risk_level] += 1
                print(f"     - {ingredient.get('name', 'Unknown')}: {risk_level}")
            
            print(f"   Risk distribution: Safe={risk_counts['safe']}, Caution={risk_counts['caution']}, Banned={risk_counts['banned']}")
            
            # Check nutritional info
            nutritional_info = response.get('nutritional_info', {})
            if nutritional_info:
                print(f"   Nutritional info found: {list(nutritional_info.keys())}")
            
            # Check OCR text
            ocr_text = response.get('ocr_text', '')
            if ocr_text:
                print(f"   OCR text length: {len(ocr_text)} characters")
                print(f"   OCR preview: {ocr_text[:100]}...")
        
        return success

    def test_invalid_file_upload(self):
        """Test uploading invalid file"""
        print("\n🔍 Testing Invalid File Upload...")
        
        # Create a text file instead of image
        text_content = io.BytesIO(b"This is not an image file")
        
        files = {
            'file': ('test.txt', text_content, 'text/plain')
        }
        
        success, response = self.run_test(
            "Invalid File Upload",
            "POST",
            "api/scan",
            400,
            files=files
        )
        
        return success

    def test_large_file_upload(self):
        """Test uploading file that's too large"""
        print("\n🔍 Testing Large File Upload...")
        
        # Create a large image (simulate > 10MB)
        # We'll create a smaller one but test the logic
        large_img = Image.new('RGB', (1000, 1000), color='red')
        img_bytes = io.BytesIO()
        large_img.save(img_bytes, format='JPEG', quality=100)
        img_bytes.seek(0)
        
        files = {
            'file': ('large_test.jpg', img_bytes, 'image/jpeg')
        }
        
        # This should pass since our test image isn't actually > 10MB
        # But it tests the upload functionality with larger files
        success, response = self.run_test(
            "Large File Upload",
            "POST",
            "api/scan",
            200,  # Should succeed with our test image
            files=files
        )
        
        return success

def main():
    print("🚀 Starting Health Awareness Label Scanner API Tests")
    print("=" * 60)
    
    # Setup
    tester = HealthScannerAPITester()
    
    # Run all tests
    tests = [
        tester.test_health_check,
        tester.test_get_ingredients,
        tester.test_get_scans,
        tester.test_scan_image,
        tester.test_invalid_file_upload,
        tester.test_large_file_upload,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1

    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())