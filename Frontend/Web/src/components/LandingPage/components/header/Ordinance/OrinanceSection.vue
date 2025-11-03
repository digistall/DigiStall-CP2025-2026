<template>
    <!-- Ordinance Modal -->
    <div v-if="isOrdinanceModalVisible" class="modal-overlay" @click="closeOrdinanceModal">
        <div class="modal-container" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
                <h2 class="modal-title">
                    Naga City Public Market Ordinance
                </h2>
                <button @click="closeOrdinanceModal" class="close-btn">
                    <span>&times;</span>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
                <div class="ordinance-content">
                    <div class="ordinance-section">
                        <h3>📋 Ordinance No. 2024-020</h3>
                        <p>
                            <strong>"Satellite and Public Market Ordinance of Naga City"</strong><br>
                            This ordinance governs the operation, management, and regulation of all public markets and
                            satellite markets within Naga City, ensuring proper sanitation, safety, and orderly conduct
                            of business.
                        </p>
                    </div>

                    <div class="ordinance-section">
                        <h4>🕐 Market Operating Hours</h4>
                        <ul>
                            <li><strong>Daily Operations:</strong> 4:30 AM - 8:00 PM</li>
                            <li><strong>Vendor Setup:</strong> 4:00 AM - 4:30 AM</li>
                            <li><strong>Market Cleanup:</strong> 8:00 PM - 9:00 PM</li>
                            <li><strong>Sunday Operations:</strong> 5:00 AM - 6:00 PM</li>
                        </ul>
                    </div>

                    <div class="ordinance-section">
                        <h4>🏪 Stall Registration Requirements</h4>
                        <ul>
                            <li>Valid Business Permit from Naga City</li>
                            <li>Market Vendor's License</li>
                            <li>Barangay Clearance</li>
                            <li>Health Certificate (for food vendors)</li>
                            <li>Payment of required fees and deposits</li>
                            <li>Compliance with fire safety standards</li>
                        </ul>
                    </div>

                    <div class="ordinance-section">
                        <h4>💰 Market Fees and Charges</h4>
                        <ul>
                            <li><strong>Stall Rental:</strong> Based on stall size and location</li>
                            <li><strong>Vendor's License Fee:</strong> Annual payment required</li>
                            <li><strong>Cleaning Fee:</strong> Daily collection fee</li>
                            <li><strong>Security Deposit:</strong> Refundable upon compliance</li>
                            <li><strong>Penalty Fees:</strong> For violations and late payments</li>
                        </ul>
                    </div>

                    <div class="ordinance-section">
                        <h4>🚫 Prohibited Activities</h4>
                        <ul>
                            <li>Selling outside designated stall areas</li>
                            <li>Blocking walkways, aisles, and emergency exits</li>
                            <li>Improper waste disposal and unsanitary practices</li>
                            <li>Selling prohibited or expired goods</li>
                            <li>Loud noise and disturbance during operations</li>
                            <li>Unauthorized modifications to stall structures</li>
                            <li>Operating without proper permits and licenses</li>
                        </ul>
                    </div>

                    <div class="ordinance-section">
                        <h4>⚠️ Violations and Penalties</h4>
                        <div class="penalty-levels">
                            <p><strong>1st Offense:</strong> Written warning and educational counseling</p>
                            <p><strong>2nd Offense:</strong> Fine of ₱500 - ₱1,000</p>
                            <p><strong>3rd Offense:</strong> Fine of ₱1,000 - ₱2,500 + 3-day suspension</p>
                            <p><strong>Subsequent Offenses:</strong> ₱2,500 - ₱5,000 fine + possible permit revocation
                            </p>
                        </div>
                        <p class="penalty-note">
                            <em>Serious violations may result in immediate suspension or revocation of market
                                privileges.</em>
                        </p>
                    </div>

                    <div class="ordinance-section">
                        <h4>🏥 Health and Sanitation Standards</h4>
                        <ul>
                            <li>Regular health examinations for food handlers</li>
                            <li>Proper food storage and display practices</li>
                            <li>Clean water supply and sanitary facilities</li>
                            <li>Waste segregation and proper disposal</li>
                            <li>Pest control and rodent prevention measures</li>
                            <li>Daily cleaning and maintenance of stalls</li>
                        </ul>
                    </div>

                    <div class="contact-info">
                        <h4>📞 Contact Information</h4>
                        <div class="contact-details">
                            <p>
                                <strong>Naga City Market Administrator</strong><br>
                                📍 Naga City Public Market, Magsaysay Avenue<br>
                                ☎️ (054) 473-2043 | (054) 472-3000<br>
                                📧 market@naga.gov.ph<br>
                                🕒 Office Hours: 8:00 AM - 5:00 PM (Monday-Friday)
                            </p>

                            <p>
                                <strong>Business Permit & Licensing Office</strong><br>
                                📍 Naga City Hall, J. Hernandez Avenue<br>
                                ☎️ (054) 473-2324<br>
                                📧 bplo@naga.gov.ph
                            </p>

                            <p>
                                <strong>Emergency Hotlines</strong><br>
                                🚨 COMCEN: 0908-525-3000 (Smart) | 0963-220-9700 (TNT)<br>
                                🔥 Fire Department: (054) 473-8472<br>
                                🚑 Emergency: (054) 472-3000
                            </p>
                        </div>
                    </div>

                    <div class="official-document">
                        <h4>Official Document</h4>
                        <p>
                            For the complete and official version of the ordinance, please refer to:
                        </p>
                        <a href="https://www2.naga.gov.ph/wp-content/uploads/2024/03/Ordno-2024-020-Satellite-and-Public-Market-Ordinance.pdf"
                            target="_blank" rel="noopener noreferrer" class="ordinance-link">
                            View Full Ordinance Document (PDF)
                        </a>
                        <p class="document-note">
                            <em>This will open the official PDF document from the Naga City Government website.</em>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
                <button @click="closeOrdinanceModal" class="btn-acknowledge">
                    I Acknowledge
                </button>
                <button @click="closeOrdinanceModal" class="btn-close">
                    Close
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "OrdinanceSection",
    props: {
        isVisible: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        isOrdinanceModalVisible: {
            get() {
                return this.isVisible;
            },
            set(value) {
                this.$emit('update:isVisible', value);
            }
        }
    },
    methods: {
        closeOrdinanceModal() {
            this.isOrdinanceModalVisible = false;
            document.body.style.overflow = 'auto';
            this.$emit('close-modal');
        },
    },
    watch: {
        isVisible(newVal) {
            if (newVal) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        }
    },
    mounted() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOrdinanceModalVisible) {
                this.closeOrdinanceModal();
            }
        });
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.closeOrdinanceModal);
        document.body.style.overflow = 'auto';
    },
};
</script>

<style scoped>
@import '@/assets/LandingPage/css/OrdinanceSectionStyles.css';
</style>