/**
 * @author Ujwala Rapolu
 *
 * @date May/25/2026
 *
 * @description CHCMIG-262 Renders the detail view for a library content record on the microsite.
 *              Wires to libraryContentDetailCtrl.getLibraryDetail to load the parent library, topic categories,
 *              and featured reference guides for the given recordId. Supports tabbed navigation between
 *              an Overview tab and per-category tabs, handles guide navigation (internal and external URLs),
 *              and surfaces toast notifications on load errors.
 */
import { LightningElement, api, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import USER_ID from '@salesforce/user/Id';
import ZxAssets from '@salesforce/resourceUrl/ZxAssets';
import getLibraryDetail from '@salesforce/apex/libraryContentDetailCtrl.getLibraryDetail';

const OVERVIEW_KEY = '__overview__';

export default class LibraryContentDetail extends NavigationMixin(LightningElement) {
    @api recordId;

    @track parentLibraryContent;
    @track _categories = [];
    @track _featured = [];
    @track activeTabKey = OVERVIEW_KEY;
    @track isLoading = false;
    @track loadFailed = false;
    @track toastDetails;

    rightIcon = ZxAssets + '/ZxAssets/Icons/System/Right.svg';

    labels = {
        overview: 'Overview',
        topicAreas: 'Topic Areas',
        featuredGuides: 'Featured Reference Guides',
        learnMore: 'Learn More',
        emptyTopics: 'No topics available for this category yet.',
        emptyCategories: 'No topic categories are linked to this library yet.',
        emptyGuides: 'No reference guides are linked to this library yet.',
        emptyCategoryContent: 'No reference guides are tagged in this category yet.',
        emptyLibrary: 'We could not load this library. Please try again later.'
    };

    @wire(getLibraryDetail, { recordId: '$recordId', userId: USER_ID })
    wiredDetail({ data, error }) {
        this.isLoading = true;
        if (data) {
            this.parentLibraryContent = data.parentLibraryContent;
            this._categories = (data.categories || []).map(cat => ({
                ...cat,
                hasTopics: !!(cat.topics && cat.topics.length),
                hasContent: !!(cat.relatedContent && cat.relatedContent.length)
            }));
            this._featured = (data.featuredReferenceGuides || []).map(g => ({
                ...g,
                hasTopics: !!(g.topics && g.topics.length)
            }));
            this.loadFailed = false;
            this.isLoading = false;
            if (this.activeTabKey !== OVERVIEW_KEY && !this._categories.find(c => c.categoryName === this.activeTabKey)) {
                this.activeTabKey = OVERVIEW_KEY;
            }
        } else if (error) {
            this.loadFailed = true;
            this.isLoading = false;
            this.parentLibraryContent = undefined;
            this._categories = [];
            this._featured = [];
            this.showToast('error', this.extractErrorMessage(error));
        }
    }

    get hasData() {
        return !!this.parentLibraryContent;
    }

    get showEmptyState() {
        return !this.isLoading && !this.parentLibraryContent && this.loadFailed;
    }

    get parentTitle() {
        return this.parentLibraryContent ? this.parentLibraryContent.title : '';
    }

    get parentDescription() {
        return this.parentLibraryContent ? this.parentLibraryContent.description : '';
    }

    get parentSummary() {
        return this.parentLibraryContent ? this.parentLibraryContent.summary : '';
    }

    get parentImageUrl() {
        return this.parentLibraryContent ? this.parentLibraryContent.imageUrl : '';
    }

    get heroStyle() {
        const url = this.parentImageUrl;
        if (!url) {
            return 'background: linear-gradient(180deg, #3a3447 0%, #272333 100%);';
        }
        return `background: linear-gradient(180deg, rgba(39,35,51,0.20) 0%, rgba(39,35,51,0.85) 100%), url('${url}') no-repeat center / cover;`;
    }

    get categories() {
        return this._categories;
    }

    get featuredReferenceGuides() {
        return this._featured;
    }

    get tabList() {
        const tabs = [{ key: OVERVIEW_KEY, label: this.labels.overview }];
        for (const category of this._categories) {
            tabs.push({ key: category.categoryName, label: category.categoryName });
        }
        return tabs.map((tab, index) => {
            const isActive = tab.key === this.activeTabKey;
            return {
                ...tab,
                cssClass: isActive ? 'tab tab-active' : 'tab',
                ariaSelected: isActive ? 'true' : 'false',
                tabIndex: isActive ? '0' : '-1',
                index
            };
        });
    }

    get isOverviewActive() {
        return this.activeTabKey === OVERVIEW_KEY;
    }

    get hasCategories() {
        return this._categories.length > 0;
    }

    get hasFeaturedGuides() {
        return this._featured.length > 0;
    }

    get activeCategory() {
        const empty = { categoryName: '', topics: [], relatedContent: [], hasTopics: false, hasContent: false };
        if (this.activeTabKey === OVERVIEW_KEY) return empty;
        return this._categories.find(c => c.categoryName === this.activeTabKey) || empty;
    }

    get activeCategoryLabel() {
        return this.activeCategory.categoryName || '';
    }

    handleTabClick(event) {
        const key = event.currentTarget.dataset.tab;
        if (key) {
            this.activeTabKey = key;
        }
    }

    handleTabKeyDown(event) {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
            return;
        }
        event.preventDefault();
        const tabs = this.tabList;
        const currentIdx = tabs.findIndex(t => t.key === this.activeTabKey);
        if (currentIdx < 0) return;
        const offset = event.key === 'ArrowRight' ? 1 : -1;
        const nextIdx = (currentIdx + offset + tabs.length) % tabs.length;
        this.activeTabKey = tabs[nextIdx].key;
        Promise.resolve().then(() => {
            const target = this.template.querySelector(`button[data-tab="${this.activeTabKey}"]`);
            if (target) target.focus();
        });
    }

    handleCategoryCardClick(event) {
        const category = event.currentTarget.dataset.category;
        if (category) {
            this.activeTabKey = category;
            this.dispatchEvent(new CustomEvent('categoryselect', { detail: { category } }));
        }
    }

    handleCategoryCardKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleCategoryCardClick(event);
        }
    }

    handleGuideClick(event) {
        const guideId = event.currentTarget.dataset.id;
        const guide = this.findGuide(guideId);
        if (!guide) return;

        this.dispatchEvent(new CustomEvent('guideselect', { detail: { guideId } }));

        if (!guide.url) {
            return;
        }
        if (guide.isLocal) {
            // showLibraryHeader=true tells ccResourcesSidebar this navigation
            // came from a library context, so it skips its own 200px
            // add-margin spacer (meant for pages with no hero of their own) -
            // this page already renders its own hero via heroStyle above.
            // Matches ccViewLibraryContent.handleRelatedContentClick's params.
            const separator = guide.url.includes('?') ? '&' : '?';
            const targetUrl = `${guide.url}${separator}showLibraryHeader=true&libraryName=${encodeURIComponent(this.parentTitle || '')}&librarySubtitle=${encodeURIComponent(this.parentSummary || '')}`;
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: { url: targetUrl }
            });
        } else {
            window.open(guide.url, '_blank', 'noopener,noreferrer');
        }
    }

    handleGuideKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleGuideClick(event);
        }
    }

    findGuide(guideId) {
        if (!guideId) return null;
        const fromFeatured = this._featured.find(g => g.id === guideId);
        if (fromFeatured) return fromFeatured;
        for (const cat of this._categories) {
            const match = (cat.relatedContent || []).find(g => g.id === guideId);
            if (match) return match;
        }
        return null;
    }

    showToast(toastType, toastMessage) {
        if (!toastMessage) return;
        this.toastDetails = { toastType, toastMessage };
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            const toast = this.template.querySelector('c-cc-toast-message');
            if (toast && this.toastDetails) {
                toast.showToast();
            }
        }, 1);
    }

    extractErrorMessage(error) {
        if (!error) return 'Unknown error';
        if (typeof error === 'string') return error;
        if (error.body) {
            if (Array.isArray(error.body)) {
                return error.body.map(b => b.message).filter(Boolean).join(', ');
            }
            if (error.body.message) return error.body.message;
        }
        return error.message || 'Unknown error';
    }
}
