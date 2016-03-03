// Initialize your app
var myApp = new Framework7({
    init: false,
    // Memungkinkan aplikasi untuk kembali ke halaman sebelumnya menggunakan hardware back button
    pushState: true,
    modalTitle: 'InEMS',
    modalButtonOk: 'Ya',
    modalButtonCancel: 'Tidak',
    animateNavBackIcon: true,
    statusbarOverlay: false
});

var tBefore, tAfter = null;

var mySearchbar = null;
myApp.onPageInit('index-left', function(page) {
    $$('a.nav-link').on('click', function() {
        var activeButton = $$(page.container).find('.unread');
        activeButton.removeClass('unread');
        $$(this).addClass('unread');
        if ($$(page.container).find('a[href="index.html"]').hasClass('unread')) {
            getDispositionInLists(UserId);
        }
    });

    $$('.open-login').on('click', function() {
        myApp.confirm('Apakah Anda yakin untuk keluar?', 'Konfirmasi keluar', function() {
            jsonData = null;
            dispId = null;
            mailId = null;
            $$('.view-main').find('.disposition-in-list').remove();
            $$('.view-main').find('.disposition-out-list').remove();
            setTimeout(function() {
                myApp.loginScreen();
            }, 500);
            myApp.loginScreen();
        });
    });

    $$('a.filter-link').on('click', function() {
        $$(document).find('.filter-link').removeClass('unread');
        mySearchbar = myApp.searchbar('.searchbar', {
            searchList: '.list-block-search',
            searchIn: 'a',
            notFoud: '.searchbar-not-found'
        });
        mySearchbar.search($$(this).data('name'));
        $$(this).addClass('unread');
        Keyboard.hide();
    });
});

// Export selectors engine
var $$ = Dom7;

$$(document).on('navbarInit', function(e) {
    if ((e.detail.page.name == 'index-1') || (e.detail.page.name == 'sentboxes')) {
        myApp.sizeNavbars('.view-main');
    }
});

var pageName, getPage = null;

$$(document).on('pageInit', function(e) {
    getPage = $$('.view-main').data('page');
    if ((getPage == 'index-1') || (getPage == 'sentboxes')) {
        $$('.filters').show();
    } else {
        $$('.filters').hide();
    }

    var page = e.detail.page;
    $$('.back').on('click', function() {
        var fromPage = page.fromPage.name;
        $$('.view-left').find('.unread').removeClass('unread');
        getPage = $$('.page-on-left').data('page');
        getPage = (getPage == 'index-1') ? 'index' : getPage;
        $$('.view-left').find('a[href="' + getPage + '.html"]').addClass('unread');
        if (getPage === 'index') {
            getDispositionInLists(UserId);
            $$('.filters').show();
        } else if (getPage === 'sentboxes') {
            getDispositionOutLists(UserId);
        } else if ((getPage === 'mail-details') || (getPage === 'memo-details')) {
            getDispositionDetails(dispId);
        }

    });

    $$('.infinite-scroll').on('infinite', function() {
        if ((getPage == 'index-1') || (getPage == 'sentboxes')) {
            lastIndex = $$(page.container).find('.page-content').find('.list-block li').length;
            if (getPage == 'index-1') {
                createNextDispView(lastIndex, '.disposition-in-list');
            } else if (getPage == 'sentboxes') {
                createNextDispView(lastIndex, '.disposition-out-list');
            }
            lastIndex = $$(page.container).find('.page-content').find('.list-block li').length;
            console.log(lastIndex);
        }
    });
});

myApp.init();

var mainView;

findSize();

var viewsWidth;

function findSize() {
    viewsWidth = $$('.views').width();
    var leftView = myApp.addView('.view-left', {
        // Because we use fixed-through navbar we can enable dynamic navbar
        dynamicNavbar: true
    });
    mainView = myApp.addView('.view-main', {
        // Because we use fixed-through navbar we can enable dynamic navbar
        dynamicNavbar: true
    });
}

// var IpAddress = '10.42.14.168'; //di lab SE
var IpAddress = '10.42.16.143'; // di lab IF
// var IpAddress = '127.0.0.1';
var Url = 'http://' + IpAddress + ':8080/sampleWebService/REST/';

// Event untuk login pengguna InEMS
var alertMessage = '';
var username, password, loginData = null;
var chipperPassword = null;
var UserId, UserName, UserDesc = null;

$$('.login-screen').find('#link').on('click', function() {
    username = $$('.login-screen').find('input[name="username"]').val();
    password = $$('.login-screen').find('input[name="password"]').val();
    validateLogin(username, password);
});

var tOverallStart, tOverallEnd = null;
$$(document).on('ajaxStart', function(e) {
    tOverallStart = performance.now();
    myApp.showIndicator();
});

// Callbacks to run code for inboxes page:
myApp.onPageBeforeInit('inboxes', function(page) {
    getInboxLists(UserName);
    getDispositionInLists(UserId);
});

// Callbacks to run code for outboxes page:
myApp.onPageBeforeInit('sentboxes', function(page) {
    getPage = $$('.view-main').data('page');
    if (getPage == page.name) {
        getDispositionOutLists(UserId);
    }
});

var jsonData = null;
var maxItem = null;
var inboxId, dispId, outboxId = null;
var target = null;
var loading = false;

function doCloseInbox() {
    myApp.closeModal();
    myApp.confirm('Apakah Anda yakin untuk menutup pesan ini?', 'Konfirmasi Tutup Surat', function() {
        closeMail(inboxId, UserId);
        mainView.router.loadPage('inboxes.html');
    });
}

function doDeleteInbox() {
    myApp.closeModal();
    myApp.confirm('Apakah Anda yakin untuk menghapus pesan ini?', 'Konfirmasi Hapus Surat', function() {
        deleteInbox(inboxId, UserId);
        mainView.router.loadPage('inboxes.html');
    });
}

function doCloseOutbox() {
    myApp.closeModal();
    myApp.confirm('Apakah Anda yakin untuk menutup pesan ini?', 'Konfirmasi Tutup Surat', function() {
        closeMail(outboxId, UserId);
        mainView.router.loadPage('sentboxes.html');
    });
}

function doDeleteOutbox() {
    myApp.closeModal();
    myApp.confirm('Apakah Anda yakin untuk menghapus pesan ini?', 'Konfirmasi Hapus Surat', function() {
        deleteOutbox(outboxId, UserId);
        mainView.router.loadPage('sentboxes.html');
    });
}

var button2 = [{
    text: 'Batal',
    color: 'red'
}];

var fileName = null;
$$(document).on('ajaxComplete', function(e) {
    myApp.hideIndicator();
    tOverallEnd = performance.now();
    console.log("Overall process:");
    console.log(tOverallEnd - tOverallStart);
    $$('a.inbox-detail').on('click', function() {
        inboxId = $$(this).data('id');
        if ($$(this).hasClass('unread')) {
            $$(this).removeClass('unread');
            readMail(inboxId);
        }
    });
    $$('a.disp-detail').on('click', function() {
        dispId = $$(this).data('id');
        if ($$(this).hasClass('unread')) {
            $$(this).removeClass('unread');
            readDisposition(dispId);
        }
        $$('.view-left').find('.unread').removeClass('unread');
    });
    $$('a.outbox-detail').on('click', function() {
        outboxId = $$(this).data('id');
    });
    $$('.open-popover-inbox').on('click', function() {
        target = $$(this);
        var button1 = [{
            text: 'Pilihan Lain',
            label: true
        }, {
            text: 'Tutup Surat',
            onClick: doCloseInbox
        }, {
            text: 'Hapus Surat',
            onClick: doDeleteInbox
        }];
        if (viewsWidth <= 768) {
            var groups = [button1, button2];
            myApp.actions(target, groups);
        } else {
            var button3 = button1.splice(1, 2);
            myApp.actions(target, button3);
        }
    });

    $$('.open-popover-outbox').on('click', function() {
        target = $$(this);
        var button1 = [{
            text: 'Pilihan Lain',
            label: true
        }, {
            text: 'Tutup Surat',
            onClick: doCloseOutbox
        }, {
            text: 'Hapus Surat',
            onClick: doDeleteOutbox
        }];
        if (viewsWidth <= 768) {
            var groups = [button1, button2];
            myApp.actions(target, groups);
        } else {
            var button3 = button1.splice(1, 2);
            myApp.actions(target, button3);
        }
    });
    $$('a.get-mail-id').on('click', function() {
        mailId = $$(this).data('id');
        console.log(mailId);
    });
    $$('.delete-inbox').on('click', function() {
        myApp.confirm('Apakah Anda yakin untuk menutup pesan ini?', 'Konfirmasi Hapus Surat', function() {
            deleteInbox(inboxId, UserId);
        });
    });

    $$('.delete-outbox').on('click', function() {
        myApp.confirm('Apakah Anda yakin untuk menutup pesan ini?', 'Konfirmasi Hapus Surat', function() {
            deleteOutbox(outboxId, UserId);
        });
    });
    $$('a.download-file').on('click', function() {
        fileName = $$(this).data('name');
        downloadAttachment(fileName);
    });
});

$$(document).on('ajaxError', function(e) {
    myApp.hideIndicator();
});


// Callbacks to run code for search-mail page:
myApp.onPageInit('search-mail', function(page) {});

// Callbacks to run specific code for inbox-details page:
myApp.onPageInit('mail-details', function(page) {
    getPage = $$('.view-main').data('page');
    if (getPage == page.name) {
        getDispositionDetails(dispId);
    }
});

myApp.onPageInit('memo-details', function(page) {
    getPage = $$('.view-main').data('page');
    if (getPage == page.name) {
        getDispositionDetails(dispId);
    }
});

// Callbacks to run specific code for inbox-details page:
myApp.onPageInit('outbox-details', function(page) {
    getOutboxDetails(outboxId);
});

// Callbacks to run specific code for disposition-details page:
myApp.onPageInit('disposition-details', function(page) {
    getPage = $$('.view-main').data('page');
    if (getPage == page.name) {
        getDispositionDetails(dispId);
    }
    $$('.delete-disp').on('click', function() {
        myApp.confirm('Apakah Anda yakin untuk menghapus disposisi ini?', 'Konfirmasi Hapus Disposisi', function() {
            deleteDisp(dispId, UserId);
        });
    });
});

// Callbacks to run specific code for About page:
myApp.onPageInit('about', function(page) {
    createSender(UserName, UserDesc);
    // run createContentPage func after link was clicked
    $$('.create-page').on('click', function() {

    });

    $$('.about-device').on('click', function() {
        aboutDevicePage();
    });
});

var alertMailForm = '';

var formData, FormDataJson = null;
var newMailData = null;
// Callbacks to run specific code for Form page:
myApp.onPageBeforeInit('mail-form', function(page) {
    getPage = $$('.view-main').data('page');
    if (getPage == page.name) {
        createReceiverListViews(UserName, '#tujuan');
        createReceiverListViews(UserName, '#tembusan');
        $$('.autocomplete-opener').css('height','44px');
        getMailMemoFormOptions(UserName);
        createSender(UserName, UserDesc);
        var calendarDateFormat = myApp.calendar({
            input: '#calendar-input',
            dateFormat: 'MM dd, yyyy'
        });
    }
    $$('.send-mail-form').on('click', function() {
        createMailMemo(page, '#form-mail', UserId);
        return false;
    });
});

myApp.onPageInit('memo-form', function(page) {
    getPage = $$('.view-main').data('page');
    if (getPage == page.name) {
        createReceiverListViews(UserName, '#tujuan');
        createReceiverListViews(UserName, '#tembusan');
        $$('.autocomplete-opener').css('height','44px');
        createSender(UserName, UserDesc);
        getMailMemoFormOptions(UserName);
        var calendarDateFormat = myApp.calendar({
            input: '#calendar-input',
            dateFormat: 'MM dd, yyyy'
        });
    }
    $$('.send-memo-form').on('click', function() {
        createMailMemo(page, '#form-memo', UserId);
        return false;
    });
});

var newDispData = null;
// Callbacks to run specific code for Form page:
myApp.onPageInit('disp-form', function(page) {
    getPage = $$('.view-main').data('page');
    if (getPage == page.name) {
        createReceiverListViews(UserName, '#tujuan');
        createReceiverListViews(UserName, '#tembusan');
        $$('.autocomplete-opener').css('height','44px');
        getDispositionFormOptions(UserName);
        var calendarDateFormat = myApp.calendar({
            input: '#calendar-input',
            dateFormat: 'MM dd, yyyy'
        });
    }
    $$('.send-disp-form').on('click', function() {
        processDisposition('#form-disp', mailId, UserId);
        return false;
    });
});

var myDevice = myApp.device;

function aboutDevicePage() {
    myApp.alert(
        'I use ' + myDevice.os + ' version ' + myDevice.osVersion + ' with ' + myDevice.pixelRatio + ' pixel ratio', 'My Device');
}
